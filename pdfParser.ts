/**
 * Client-Side Real-Time PDF Parser using PDF.js
 * Extracts raw text, headings, and mathematical equations from any PDF file
 * without requiring server-side API keys or external services.
 */

import { Block, ConversionResult } from '../types';

// Dynamically load PDF.js from a standard public CDN
export const loadPdfJS = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('PDF.js can only be loaded in a browser environment.'));
      return;
    }

    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      // Set worker source URL
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = (e) => reject(new Error('Failed to load PDF.js parser engine from CDN.'));
    document.head.appendChild(script);
  });
};

/**
 * Parsers PDF ArrayBuffer locally and returns structured layout blocks
 */
export const parsePdfLocally = async (arrayBuffer: ArrayBuffer, fileName: string): Promise<ConversionResult> => {
  const pdfjsLib = await loadPdfJS();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const blocks: Block[] = [];
  let fullAbstractText = '';
  let title = fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "); // fallback title
  
  // Parse page-by-page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];
    
    // Group text items by vertical height (approximate lines)
    const linesMap = new Map<number, any[]>();
    
    for (const item of items) {
      if (!item.str || !item.str.trim()) continue;
      
      // Get the vertical Y position (rounded to avoid small floating point differences)
      const y = Math.round(item.transform[5]);
      
      // Find an existing line close to this Y position
      let foundKey: number | null = null;
      for (const key of linesMap.keys()) {
        if (Math.abs(key - y) < 4) {
          foundKey = key;
          break;
        }
      }
      
      if (foundKey !== null) {
        linesMap.get(foundKey)!.push(item);
      } else {
        linesMap.set(y, [item]);
      }
    }
    
    // Sort lines from top of the page to bottom (descending Y coordinates)
    const sortedYKeys = Array.from(linesMap.keys()).sort((a, b) => b - a);
    
    const lines: string[] = [];
    for (const y of sortedYKeys) {
      const lineItems = linesMap.get(y)!;
      // Sort items within the same line horizontally (ascending X coordinates)
      lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
      const lineText = lineItems.map(item => item.str).join(' ');
      if (lineText.trim()) {
        lines.push(lineText.trim());
      }
    }
    
    // Simple heuristic to split lines into structured paragraphs or headings
    let currentParagraph = '';
    const paragraphs: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line looks like a heading
      const isHeaderLine = line.match(/^(section|chapter|appendix|abstract|conclusion|introduction|references|\d+(\.\d+)*)\b/i) || 
                           (line.length < 50 && line === line.toUpperCase() && line.trim().length > 3);
      
      if (isHeaderLine) {
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
        }
        paragraphs.push('__HEADER__' + line);
      } else {
        // Concatenate lines. If it ends with punctuation, flush as paragraph
        if (line.endsWith('.') || line.endsWith('?') || line.endsWith('!')) {
          currentParagraph += (currentParagraph ? ' ' : '') + line;
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
        } else {
          currentParagraph += (currentParagraph ? ' ' : '') + line;
          
          // Heuristic: If next line is a header or far down, flush
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const nextIsHeader = nextLine.match(/^(section|chapter|appendix|abstract|conclusion|introduction|references|\d+(\.\d+)*)\b/i);
            if (nextIsHeader) {
              paragraphs.push(currentParagraph.trim());
              currentParagraph = '';
            }
          }
        }
      }
    }
    
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim());
    }
    
    // Collect first page info for title/abstract
    if (pageNum === 1 && lines.length > 0) {
      // Find title candidate: longest of first 3 lines
      const titleCandidate = lines.slice(0, 4).reduce((longest, curr) => 
        (curr.length > longest.length && curr.length < 90 && !curr.toLowerCase().includes('pdf')) ? curr : longest
      , '');
      if (titleCandidate.trim().length > 10) {
        title = titleCandidate.trim();
      }
      
      // Abstract candidate
      const absIndex = paragraphs.findIndex(p => p.toLowerCase().startsWith('abstract') || p.toLowerCase().includes('abstract:'));
      if (absIndex !== -1) {
        fullAbstractText = paragraphs[absIndex].replace(/abstract:?/i, '').trim();
      } else {
        // Fallback to first few prose blocks
        fullAbstractText = paragraphs.filter(p => !p.startsWith('__HEADER__')).slice(0, 2).join(' ');
      }
    }
    
    // Map paragraphs to Conversion Blocks
    paragraphs.forEach((p, idx) => {
      const id = `local_page_${pageNum}_block_${idx}`;
      
      if (p.startsWith('__HEADER__')) {
        const text = p.replace('__HEADER__', '').trim();
        blocks.push({
          id,
          type: 'heading',
          content: {
            text,
            level: text.match(/^\d+(\.\d+)*\s/) ? 1 : 2
          }
        });
      } else {
        // Heuristic: Is it mathematical?
        const hasMathIndicators = p.includes('$') || p.includes('\\') || p.includes('=') || p.includes('+') || p.includes('-');
        const isMathEquation = hasMathIndicators && p.length < 200 && (p.includes('\\int') || p.includes('\\sum') || p.includes('\\lambda') || p.includes('f(x)') || p.includes('\\alpha') || p.includes('omega') || p.includes('^'));
        
        if (isMathEquation) {
          // Translate LaTeX mathematical symbols into high-quality spoken voice narrative
          let spoken = p;
          spoken = spoken.replace(/\\int/g, 'the integral of ');
          spoken = spoken.replace(/\\sum/g, 'the summation of ');
          spoken = spoken.replace(/\\alpha/g, 'alpha');
          spoken = spoken.replace(/\\beta/g, 'beta');
          spoken = spoken.replace(/\\gamma/g, 'gamma');
          spoken = spoken.replace(/\\omega/g, 'omega');
          spoken = spoken.replace(/\\phi/g, 'phi');
          spoken = spoken.replace(/\\pi/g, 'pi');
          spoken = spoken.replace(/\\theta/g, 'theta');
          spoken = spoken.replace(/\\lambda/g, 'lambda');
          spoken = spoken.replace(/f\(x\)/g, 'f of x');
          spoken = spoken.replace(/\\to/g, 'approaches');
          spoken = spoken.replace(/\\lim/g, 'limit');
          spoken = spoken.replace(/\\sqrt/g, 'square root of');
          spoken = spoken.replace(/\\Delta/g, 'delta');
          spoken = spoken.replace(/\\Delta x/g, 'delta x');
          spoken = spoken.replace(/\^/g, ' raised to the power of ');
          
          blocks.push({
            id,
            type: 'equation',
            content: {
              latex: p,
              spoken_logic: `Formula: ${spoken}`
            }
          });
        } else {
          blocks.push({
            id,
            type: 'prose',
            content: {
              text: p
            }
          });
        }
      }
    });
  }
  
  return {
    metadata: {
      title,
      authors: ['Real-Time Local Reader'],
      abstract: fullAbstractText || 'This scientific homework or paper has been extracted locally using real-time browser-based text layout structures.'
    },
    blocks: blocks.filter(b => {
      if (b.type === 'heading') return (b.content.text || '').length > 2;
      if (b.type === 'prose') return (b.content.text || '').length > 4;
      return true;
    })
  };
};

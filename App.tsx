/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Square, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Upload, 
  Download, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  Languages, 
  Info, 
  Search,
  Maximize2,
  FileCode,
  LayoutGrid,
  CheckCircle,
  AlertCircle,
  Eye,
  Sliders,
  HelpCircle,
  Building,
  User,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { Metadata, Block, ConversionResult } from './types';
import { parsePdfLocally } from './lib/pdfParser';

export default function App() {
  // Application State
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [convertedResult, setConvertedResult] = useState<ConversionResult | null>(null);
  const [parserMode, setParserMode] = useState<'local' | 'gemini'>('local');
  const [webpageUrl, setWebpageUrl] = useState<string>('');
  
  // Accessibility State
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(-1);
  const [speechRate, setSpeechRate] = useState<number>(1.1);
  const [textSize, setTextSize] = useState<number>(18); // Base text size in px
  const [isHighContrastDark, setIsHighContrastDark] = useState<boolean>(false);
  const [continuousRead, setContinuousRead] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'reader' | 'brainstorm' | 'embosser'>('reader');
  
  // Speech Synthesis Refs & State
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const blockRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    
    // Auto-select the first sample on load to make the app ready-to-test
    loadSample(1);

    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const allVoices = window.speechSynthesis.getVoices();
        setVoices(allVoices);
        
        // Pick a premium or high quality English voice as default if available
        if (allVoices.length > 0) {
          const preferredVoice = allVoices.find(v => 
            v.lang.startsWith('en-') && 
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Siri') || v.name.includes('Microsoft') || v.name.includes('Daniel'))
          );
          const englishVoice = preferredVoice || allVoices.find(v => v.lang.startsWith('en-'));
          const defaultVoice = englishVoice || allVoices[0];
          setSelectedVoiceName(prev => prev || defaultVoice.name);
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Clean up speech on unmount
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Keyboard Shortcuts for Accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus on reader tab to prevent key clashes
      if (activeTab !== 'reader') return;

      // Avoid trigger when typing in input/textarea
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateBlock('next');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateBlock('prev');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        stopSpeech();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (activeBlockIndex !== -1) {
          speakBlock(activeBlockIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeBlockIndex, isPlaying, convertedResult, speechRate, continuousRead, activeTab]);

  // Voice Greeting on interaction
  const triggerGreeting = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    
    const greeting = new SpeechSynthesisUtterance(
      "Welcome to the Multi Sensory Paper Converter. Press the Spacebar to play or pause the current paragraph. Use Arrow Up and Arrow Down to navigate through headings, math equations, and diagram explanations. Drag and drop any technical PDF file to convert it instantly."
    );
    if (selectedVoiceName) {
      const selectedVoiceObj = window.speechSynthesis.getVoices().find(v => v.name === selectedVoiceName);
      if (selectedVoiceObj) greeting.voice = selectedVoiceObj;
    }
    greeting.rate = speechRate;
    synthRef.current.speak(greeting);
    
    // Announce to low vision/screen reader via standard alert
    const announcement = document.getElementById('sr-announcement');
    if (announcement) {
      announcement.textContent = "Welcome greeting playing. Press space to control.";
    }
  };

  // Pre-converted STEM Samples
  const loadSample = (sampleNum: number) => {
    setIsConverting(true);
    setError(null);
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    
    // Simulating rapid processing for pre-loaded samples
    setTimeout(() => {
      try {
        let sampleData: ConversionResult;
        let name = '';
        
        if (sampleNum === 1) {
          name = 'Multi_Sensory_Paper_Converter_Abstract.pdf';
          sampleData = {
            metadata: {
              title: 'A Multi-Sensory Science Paper Converter for Blind and Low-Vision Researchers',
              authors: ['Ketan Palani', 'Rachael Adnin', 'Saurabh Nagar'],
              abstract: 'We present an end-to-end automated accessibility pipeline that converts visual, notation-heavy technical literature into highly structured multi-sensory packages. By leveraging multimodal generative models, we produce spoken mathematical equation logic, embossing-ready vector SVGs, and semantic figure narratives that enable low-vision researchers to explore technical charts and schematics independently.'
            },
            blocks: [
              {
                id: 'sec1',
                type: 'heading',
                content: { text: '1. Introduction and Architectural Design', level: 1 }
              },
              {
                id: 'p1_prose',
                type: 'prose',
                content: { text: 'Scientific research papers are highly structural, presenting multi-column prose interspersed with algebraic derivations, multi-panel line plots, and technical tables. Standard screen readers narrate textual columns sequentially, but experience critical failures when interpreting non-linear elements. Mathematical equations are flattened into basic character lists, while figures are entirely ignored or reduced to static alt-text that misses deep trend semantics.' }
              },
              {
                id: 'eq_math1',
                type: 'equation',
                content: {
                  latex: 'S_A(\\omega) = \\sum_{k=1}^{K} \\psi_k(e^{-\\gamma \\cdot \\tau_k}) \\cdot \\Phi_k(\\omega)',
                  spoken_logic: 'Capital S sub A of omega is equal to the summation from k equals 1 to capital K of the product of two terms. The first term is psi sub k evaluated at: Euler\'s constant raised to the power of negative gamma times tau sub k. The second term is capital Phi sub k of omega. This mathematical representation models the sensory audio-tactile energy coefficient across frequency bands.'
                }
              },
              {
                id: 'p2_prose',
                type: 'prose',
                content: { text: 'Our pipeline divides the paper conversion process into three parallel accessibility layers: equation-to-speech hierarchy logic, tactile SVG generation for embossers, and semantic caption-linked visual summarization. The general workflow is visualized in Figure 1 below.' }
              },
              {
                id: 'fig_workflow',
                type: 'figure',
                content: {
                  original_caption: 'Figure 1: Multi-Sensory Document Parsing and Layered Synthesis Pipeline.',
                  alt_text: 'A structured flow diagram mapping PDF Document input to three parallel accessible output nodes.',
                  semantic_summary: 'This architectural flowchart diagrams the automated conversion pipeline. It starts with a single central node on the left labeled "Input PDF". A thick directional path connects this input to a "Layout Segmentation Engine" which acts as the main splitter. From this parser, three parallel horizontal tracks emerge: The upper track goes to the "Spoken Math Logic Engine", outputting spoken text-to-speech formulas. The middle track goes to the "Tactile SVG Vector Generator", which translates complex plots into simple, black-and-white, micro-capsule compatible swell-paper SVGs. The bottom track goes to the "Semantic Figure Summarization Engine", producing caption-linked statistical reports. All three tracks terminate on the right in a unified "Multi-Sensory Accessible Output Package".',
                  tactile_svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>
  <rect x="30" y="140" width="100" height="70" fill="none" stroke="#000000" stroke-width="4"/>
  <text x="80" y="180" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle">INPUT PDF</text>
  <line x1="130" y1="175" x2="170" y2="175" stroke="#000000" stroke-width="4"/>
  <polygon points="170,170 180,175 170,180" fill="#000000"/>
  <rect x="180" y="130" width="120" height="90" fill="none" stroke="#000000" stroke-width="4"/>
  <text x="240" y="170" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">SEGMENTATION</text>
  <text x="240" y="190" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">ENGINE</text>
  <path d="M 300 175 L 340 75 L 370 75" fill="none" stroke="#000000" stroke-width="3"/>
  <polygon points="365,71 375,75 365,79" fill="#000000"/>
  <rect x="375" y="40" width="100" height="70" fill="none" stroke="#000000" stroke-width="3"/>
  <text x="425" y="75" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">SPOKEN MATH</text>
  <text x="425" y="95" font-family="monospace" font-size="12" text-anchor="middle">(Audio Layer)</text>
  <line x1="300" y1="175" x2="370" y2="175" stroke="#000000" stroke-width="3"/>
  <polygon points="365,171 375,175 365,179" fill="#000000"/>
  <rect x="375" y="140" width="100" height="70" fill="none" stroke="#000000" stroke-width="3"/>
  <text x="425" y="175" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">TACTILE SVG</text>
  <text x="425" y="195" font-family="monospace" font-size="12" text-anchor="middle">(Embosser Panel)</text>
  <path d="M 300 175 L 340 275 L 370 275" fill="none" stroke="#000000" stroke-width="3"/>
  <polygon points="365,271 375,275 365,279" fill="#000000"/>
  <rect x="375" y="240" width="100" height="70" fill="none" stroke="#000000" stroke-width="3"/>
  <text x="425" y="275" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">SEMANTIC SUM</text>
  <text x="425" y="295" font-family="monospace" font-size="12" text-anchor="middle">(Text Summary)</text>
  <path d="M 475 75 L 505 175" fill="none" stroke="#000000" stroke-width="3"/>
  <line x1="475" y1="175" x2="505" y2="175" stroke="#000000" stroke-width="3"/>
  <path d="M 475 275 L 505 175" fill="none" stroke="#000000" stroke-width="3"/>
  <polygon points="500,170 510,175 500,180" fill="#000000"/>
  <circle cx="535" cy="175" r="25" fill="none" stroke="#000000" stroke-width="4"/>
  <text x="535" y="180" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">OUT</text>
</svg>`
                }
              },
              {
                id: 'sec2',
                type: 'heading',
                content: { text: '2. Pipeline Performance Evaluation', level: 1 }
              },
              {
                id: 'p3_prose',
                type: 'prose',
                content: { text: 'We evaluated our layout conversion accuracy and speed compared to traditional manual transcription teams. Sighted assistive offices usually require several days or even weeks to manually describe images and tactile boards. Our automated model achieves a significant speedup with high linguistic alignment.' }
              },
              {
                id: 'table_performance',
                type: 'table',
                content: {
                  caption: 'Table 2: Time and Quality Comparison between Manual Conversion and GenAI Multi-Sensory Pipeline.',
                  markdown: '| Pipeline Step | Sighted Human (Average) | Our Automated Pipeline | Quality Rating (Fidelity) |\n|---|---|---|---|\n| Text Extraction | 2.5 Hours | 1.8 Seconds | 99.1% Layout Match |\n| Spoken Math Logic | 4.0 Hours | 4.5 Seconds | 95.4% Comprehension |\n| Tactile Vector Layout | 14.2 Hours | 8.2 Seconds | 89.2% Embosser Accuracy |\n| Semantic Summary | 5.5 Hours | 3.1 Seconds | 92.5% Detail Fidelity |',
                  summary: 'This table maps the substantial efficiency improvements of our automated GenAI pipeline against manual sighted human transcription services. For text extraction, manual efforts average 2.5 hours compared to 1.8 seconds in our pipeline (retaining a 99.1% layout match). Equation narration is processed in 4.5 seconds instead of 4 hours. Most notably, tactile vector layouts, which manually require an average of 14.2 hours of draft designing, are generated in just 8.2 seconds with an 89.2% embosser-compatible accuracy rate.'
                }
              }
            ]
          };
        } else if (sampleNum === 2) {
          name = 'Calculus_Limits_Homework.pdf';
          sampleData = {
            metadata: {
              title: 'Advanced Calculus Homework: Limits & Definite Integrals',
              authors: ['Alex Rivera (Student Submission)', 'Course: MATH-201'],
              abstract: 'This assignment covers computing fundamental limits, demonstrating the Riemann Sum formulation of definite integrals, and proving the Fundamental Theorem of Calculus through interactive visual proof schematics.'
            },
            blocks: [
              {
                id: 'h1',
                type: 'heading',
                content: { text: 'Section 1: Limits and Continuity', level: 1 }
              },
              {
                id: 'p1',
                type: 'prose',
                content: { text: 'Evaluate the limit as x approaches zero of the function f of x, representing the classic dampened harmonic oscillator boundary condition. The function is defined below.' }
              },
              {
                id: 'eq1',
                type: 'equation',
                content: {
                  latex: '\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1',
                  spoken_logic: 'The limit as x approaches zero of the fraction with numerator sine of x, and denominator x, is exactly equal to 1. This is a fundamental trigonometric limit. Rather than evaluating to zero over zero, the ratio of the arc length to the chord length approaches unity as the angle goes to zero.'
                }
              },
              {
                id: 'p2',
                type: 'prose',
                content: { text: 'We visualize this limit geometrically using a unit circle. Consider the area of the sector compared to the area of the inscribed and circumscribed triangles.' }
              },
              {
                id: 'fig1',
                type: 'figure',
                content: {
                  original_caption: 'Figure 1: Geometric Squeeze Theorem representation on the unit circle.',
                  alt_text: 'A circular sector with two nested triangles showing the geometric inequality of sine x, x, and tangent x.',
                  semantic_summary: 'This geometric proof shows a unit circle sector of angle x. There are three regions: an inscribed right triangle of height sine of x and base cosine of x (area is 1/2 sine x cosine x); the circular sector itself of arc length x (area is 1/2 x); and a larger circumscribed right triangle of height tangent of x and base 1 (area is 1/2 tangent x). This establishes the inequality: sine of x is less than x, which is less than tangent of x. Dividing by sine of x and taking limits squeezes the ratio to 1.',
                  tactile_svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>
  <line x1="50" y1="350" x2="450" y2="350" stroke="#000000" stroke-width="4"/>
  <line x1="50" y1="50" x2="50" y2="350" stroke="#000000" stroke-width="4"/>
  <path d="M 50 350 A 300 300 0 0 1 350 50" fill="none" stroke="#000000" stroke-width="5"/>
  <line x1="50" y1="350" x2="262" y2="138" stroke="#000000" stroke-width="4"/>
  <line x1="262" y1="138" x2="262" y2="350" stroke="#000000" stroke-width="4" stroke-dasharray="8 4"/>
  <line x1="350" y1="50" x2="350" y2="350" stroke="#000000" stroke-width="4"/>
  <line x1="262" y1="138" x2="350" y2="50" stroke="#000000" stroke-width="4" stroke-dasharray="2 2"/>
  <text x="40" y="365" font-family="monospace" font-size="20" font-weight="bold">O</text>
  <text x="360" y="365" font-family="monospace" font-size="20" font-weight="bold">A(1,0)</text>
  <text x="240" y="125" font-family="monospace" font-size="20" font-weight="bold">P</text>
  <text x="365" y="45" font-family="monospace" font-size="20" font-weight="bold">T</text>
  <text x="110" y="325" font-family="monospace" font-size="22" font-weight="bold">angle x</text>
  <text x="280" y="240" font-family="monospace" font-size="18" font-weight="bold">SIN</text>
  <text x="370" y="190" font-family="monospace" font-size="18" font-weight="bold">TAN</text>
</svg>`
                }
              },
              {
                id: 'h2',
                type: 'heading',
                content: { text: 'Section 2: Riemann Sums and Integration', level: 1 }
              },
              {
                id: 'p3',
                type: 'prose',
                content: { text: 'Next, we analyze how the definite integral is constructed as the limit of Riemann Sums. We partition the interval [a, b] into n subintervals and sum up the areas of approximating rectangular columns.' }
              },
              {
                id: 'eq2',
                type: 'equation',
                content: {
                  latex: '\\int_{a}^{b} f(x) dx = \\lim_{n \\to \\infty} \\sum_{i=1}^{n} f(x_i^*) \\Delta x',
                  spoken_logic: 'The definite integral from lower limit a to upper limit b of f of x with respect to x, is defined as the limit as n approaches infinity of the summation from i equals 1 to n, of f evaluated at x sub i star, multiplied by delta x. Here, delta x represents the width of each approximating rectangle, and f of x sub i star represents its height.'
                }
              },
              {
                id: 'table1',
                type: 'table',
                content: {
                  caption: 'Table 1: Convergence of Left and Right Riemann Sums for f(x) = x^2 from x=0 to x=1.',
                  markdown: '| Number of Partitions (n) | Left Riemann Sum | Right Riemann Sum | True Analytical Value |\n|---|---|---|---|\n| 10 | 0.2850 | 0.3850 | 0.3333 |\n| 100 | 0.3284 | 0.3384 | 0.3333 |\n| 1000 | 0.3328 | 0.3338 | 0.3333 |\n| 10000 | 0.3333 | 0.3333 | 0.3333 |',
                  summary: 'This table shows the numerical convergence of Left and Right Riemann Sum approximations of the integral of x squared from 0 to 1, whose true analytical value is exactly one third, or 0.3333. At 10 partitions, the Left Sum is 0.2850 (an underestimation) and the Right Sum is 0.3850 (an overestimation). As partitions increase to 10000, both Left and Right sums converge exactly to 0.3333, proving that both bounds converge to the Riemann Integral.'
                }
              }
            ]
          };
        } else {
          name = 'Neural_Network_Architecture.pdf';
          sampleData = {
            metadata: {
              title: 'Multilayer Perceptron Neural Network Feedforward Progression',
              authors: ['Dr. Linda Zhang', 'Machine Learning Lab'],
              abstract: 'This paper analyzes the mathematical foundations of dense neural connections. We detail the linear matrices, activations, and feedforward propagation pathways, alongside error surface optimizations.'
            },
            blocks: [
              {
                id: 'h1_nn',
                type: 'heading',
                content: { text: '1. Multilayer Layer Feedforward Topology', level: 1 }
              },
              {
                id: 'p1_nn',
                type: 'prose',
                content: { text: 'A basic artificial neural network coordinates layers of visual processing nodes. Weighted matrices calculate feedforward dot products, which are squeezed by non-linear activations prior to loss scoring.' }
              },
              {
                id: 'eq_nn1',
                type: 'equation',
                content: {
                  latex: 'a_j^{(l+1)} = \\sigma \\left( \\sum_{k} w_{jk}^{(l)} a_k^{(l)} + b_j^{(l)} \\right)',
                  spoken_logic: 'The activation a sub j in layer l plus 1 is equal to sigma evaluated at: the sum over k of weight w sub j k in layer l multiplied by activation a sub k in layer l, plus the bias b sub j in layer l. Sigma represents the activation function, such as the Rectified Linear Unit or sigmoid, which introduces non-linearity into the network.'
                }
              },
              {
                id: 'fig_nn_flow',
                type: 'figure',
                content: {
                  original_caption: 'Figure 1: Fully connected neural feedforward progression.',
                  alt_text: 'A three-layer deep neural network topology containing input, hidden, and output node groups.',
                  semantic_summary: 'This diagram illustrates a three-layer dense neural network: Input, Hidden, and Output layers. The Input layer has 3 nodes labeled x1, x2, x3. The Hidden layer has 4 nodes labeled h1, h2, h3, h4. The Output layer has 2 nodes labeled y1, y2. Every node in the Input layer is connected to every node in the Hidden layer, and every node in the Hidden layer is connected to the Output layer, representing a fully connected, feedforward relationship. Weighted connections progress strictly from left to right.',
                  tactile_svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>
  <circle cx="100" cy="80" r="25" fill="none" stroke="#000000" stroke-width="3"/>
  <circle cx="100" cy="150" r="25" fill="none" stroke="#000000" stroke-width="3"/>
  <circle cx="100" cy="220" r="25" fill="none" stroke="#000000" stroke-width="3"/>
  <circle cx="300" cy="50" r="25" fill="none" stroke="#000000" stroke-width="3"/>
  <circle cx="300" cy="116" r="25" fill="none" stroke="#000000" stroke-width="3"/>
  <circle cx="300" cy="183" r="25" fill="none" stroke="#000000" stroke-width="3"/>
  <circle cx="300" cy="250" r="25" fill="none" stroke="#000000" stroke-width="3"/>
  <circle cx="500" cy="100" r="25" fill="none" stroke="#000000" stroke-width="3"/>
  <circle cx="500" cy="200" r="25" fill="none" stroke="#000000" stroke-width="3"/>
  <!-- Arrows representation -->
  <line x1="125" y1="80" x2="275" y2="50" stroke="#000000" stroke-width="3" stroke-dasharray="2 2"/>
  <line x1="125" y1="150" x2="275" y2="116" stroke="#000000" stroke-width="3"/>
  <line x1="325" y1="116" x2="475" y2="100" stroke="#000000" stroke-width="3"/>
  <text x="100" y="155" font-family="monospace" font-size="12" text-anchor="middle">INP</text>
  <text x="300" y="121" font-family="monospace" font-size="12" text-anchor="middle">HID</text>
  <text x="500" y="155" font-family="monospace" font-size="12" text-anchor="middle">OUT</text>
</svg>`
                }
              }
            ]
          };
        }
        
        setFileName(name);
        setConvertedResult(sampleData);
        setActiveBlockIndex(-1);
      } catch (err) {
        console.error(err);
        setError('Error loading sample data.');
      } finally {
        setIsConverting(false);
      }
    }, 400);
  };

  // Convert custom uploaded file via Server API or Client-Side Local Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Please select a valid PDF document.');
      return;
    }
    
    setIsConverting(true);
    setError(null);
    setFileName(file.name);
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        
        if (parserMode === 'local') {
          // Instant Real-Time Client-Side Parse
          const localData = await parsePdfLocally(arrayBuffer, file.name);
          setConvertedResult(localData);
          setActiveBlockIndex(-1);
          
          const utterance = new SpeechSynthesisUtterance("Instant local conversion complete! Successfully parsed and loaded " + file.name);
          if (selectedVoiceName) {
            const selectedVoiceObj = window.speechSynthesis.getVoices().find(v => v.name === selectedVoiceName);
            if (selectedVoiceObj) utterance.voice = selectedVoiceObj;
          }
          utterance.rate = speechRate;
          synthRef.current?.speak(utterance);
        } else {
          // Advanced Multi-Sensory Gemini API Parser
          // Convert arrayBuffer to base64
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          const len = uint8Array.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64String = window.btoa(binary);
          
          const response = await fetch('/api/convert-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              pdfBase64: base64String,
              fileName: file.name,
            }),
          });
          
          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || errData.details || 'Server error during parsing.');
          }
          
          const data: ConversionResult = await response.json();
          setConvertedResult(data);
          setActiveBlockIndex(-1);
          
          const utterance = new SpeechSynthesisUtterance("Gemini layout extraction complete! Loaded " + file.name);
          if (selectedVoiceName) {
            const selectedVoiceObj = window.speechSynthesis.getVoices().find(v => v.name === selectedVoiceName);
            if (selectedVoiceObj) utterance.voice = selectedVoiceObj;
          }
          utterance.rate = speechRate;
          synthRef.current?.speak(utterance);
        }
      } catch (err: any) {
        console.error('Upload conversion error:', err);
        setError(err.message || 'An unexpected error occurred while processing this PDF.');
      } finally {
        setIsConverting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  // Convert custom webpage URL via Server API
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webpageUrl.trim()) return;
    
    setIsConverting(true);
    setError(null);
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    
    try {
      const response = await fetch('/api/convert-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webpageUrl,
        }),
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.details || 'Error accessing/parsing target website content.');
      }
      
      const data: ConversionResult = await response.json();
      setConvertedResult(data);
      setActiveBlockIndex(-1);
      
      const utterance = new SpeechSynthesisUtterance("Webpage conversion complete! Successfully loaded " + data.metadata.title);
      if (selectedVoiceName) {
        const selectedVoiceObj = window.speechSynthesis.getVoices().find(v => v.name === selectedVoiceName);
        if (selectedVoiceObj) utterance.voice = selectedVoiceObj;
      }
      utterance.rate = speechRate;
      synthRef.current?.speak(utterance);
      
    } catch (err: any) {
      console.error('URL parse error:', err);
      setError(err.message || 'An unexpected error occurred while fetching this URL.');
    } finally {
      setIsConverting(false);
    }
  };

  // Speech Controller Logic
  const speakBlock = (index: number) => {
    if (!synthRef.current || !convertedResult) return;

    synthRef.current.cancel(); // Stop any ongoing speech
    
    if (index < 0 || index >= convertedResult.blocks.length) {
      setIsPlaying(false);
      return;
    }

    const block = convertedResult.blocks[index];
    let textToSpeak = '';

    switch (block.type) {
      case 'heading':
        textToSpeak = `Heading. Level ${block.content.level}. ${block.content.text}`;
        break;
      case 'prose':
        textToSpeak = block.content.text || '';
        break;
      case 'equation':
        textToSpeak = `Equation Block. Math reads: ${block.content.spoken_logic || 'Equation notation available'}`;
        break;
      case 'figure':
        textToSpeak = `Figure Caption: ${block.content.original_caption}. General description: ${block.content.alt_text}. Explanatory narrative: ${block.content.semantic_summary}`;
        break;
      case 'table':
        textToSpeak = `Table Caption: ${block.content.caption}. Data overview: ${block.content.summary}`;
        break;
    }

    // Scroll block into view smoothly
    blockRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setActiveBlockIndex(index);
    setIsPlaying(true);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (selectedVoiceName) {
      const selectedVoiceObj = window.speechSynthesis.getVoices().find(v => v.name === selectedVoiceName);
      if (selectedVoiceObj) utterance.voice = selectedVoiceObj;
    }
    utteranceRef.current = utterance;
    utterance.rate = speechRate;

    utterance.onend = () => {
      setIsPlaying(false);
      if (continuousRead) {
        // Automatically proceed to next block
        const nextIndex = index + 1;
        if (nextIndex < convertedResult.blocks.length) {
          speakBlock(nextIndex);
        } else {
          // Finished reading the paper
          const finishedUtterance = new SpeechSynthesisUtterance("Finished reading the complete document.");
          if (selectedVoiceName) {
            const selectedVoiceObj = window.speechSynthesis.getVoices().find(v => v.name === selectedVoiceName);
            if (selectedVoiceObj) finishedUtterance.voice = selectedVoiceObj;
          }
          finishedUtterance.rate = speechRate;
          synthRef.current?.speak(finishedUtterance);
        }
      }
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsPlaying(false);
    };

    synthRef.current.speak(utterance);
    
    // Screen reader announcement
    const announcement = document.getElementById('sr-announcement');
    if (announcement) {
      announcement.textContent = `Reading block ${index + 1} of ${convertedResult.blocks.length}. ${block.type} element.`;
    }
  };

  const togglePlayPause = () => {
    if (!synthRef.current || !convertedResult) return;

    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
    } else {
      const indexToPlay = activeBlockIndex === -1 ? 0 : activeBlockIndex;
      speakBlock(indexToPlay);
    }
  };

  const stopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
  };

  const navigateBlock = (direction: 'next' | 'prev') => {
    if (!convertedResult) return;
    
    let nextIndex = activeBlockIndex;
    if (direction === 'next') {
      nextIndex = activeBlockIndex + 1;
      if (nextIndex >= convertedResult.blocks.length) nextIndex = 0; // Wrap to start
    } else {
      nextIndex = activeBlockIndex - 1;
      if (nextIndex < 0) nextIndex = convertedResult.blocks.length - 1; // Wrap to end
    }
    
    speakBlock(nextIndex);
  };

  // Helper to download the tactile SVG
  const downloadSVG = (svgString: string, id: string) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tactile_embosser_graphic_${id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      id="app-root"
      className={`min-h-screen font-sans transition-colors duration-300 ${
        isHighContrastDark 
          ? 'bg-black text-white selection:bg-yellow-400 selection:text-black' 
          : 'bg-[#faf9f6] text-zinc-900 selection:bg-zinc-800 selection:text-white'
      }`}
      style={{ fontSize: `${textSize}px` }}
    >
      {/* Hidden screen-reader announcements panel */}
      <div 
        id="sr-announcement" 
        className="sr-only" 
        role="status" 
        aria-live="assertive" 
        aria-atomic="true"
      ></div>

      {/* Global Accessibility Bar */}
      <header className={`border-b px-4 py-3 sticky top-0 z-50 transition-colors ${
        isHighContrastDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Volume2 className={`w-8 h-8 ${isHighContrastDark ? 'text-yellow-400' : 'text-zinc-800'}`} aria-hidden="true" />
            <div>
              <h1 id="main-title" className="font-extrabold text-xl tracking-tight flex items-center gap-2">
                Multi-Sensory STEM Paper Reader
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">Accessible Platform</span>
              </h1>
              <p className="text-xs text-zinc-500">Helping blind and low-vision researchers independently explore diagrams, maths, and code</p>
            </div>
          </div>

          {/* Quick Access controls */}
          <div className="flex flex-wrap items-center gap-3 justify-center">
            {/* Greeting */}
            <button
              id="btn-vocal-greet"
              onClick={triggerGreeting}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isHighContrastDark 
                  ? 'bg-zinc-900 text-yellow-300 border border-yellow-300 hover:bg-yellow-400 hover:text-black' 
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
              }`}
              title="Speak Welcome Greeting and Instructions"
              aria-label="Vocal Instruction Greeting"
            >
              <Volume2 className="w-4 h-4" />
              vocal instructions
            </button>

            {/* High Contrast Mode */}
            <button 
              id="btn-high-contrast"
              onClick={() => setIsHighContrastDark(!isHighContrastDark)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                isHighContrastDark 
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300' 
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm'
              }`}
              aria-label="Toggle High Contrast Display"
            >
              <Eye className="w-4 h-4" />
              {isHighContrastDark ? 'light theme' : 'high-contrast'}
            </button>

            {/* Text Scaling Control */}
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-950 px-2 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-bold">Text Size:</span>
              <button 
                id="btn-font-decrease"
                onClick={() => setTextSize(Math.max(14, textSize - 2))}
                className="w-6 h-6 flex items-center justify-center font-bold text-sm bg-white dark:bg-zinc-900 rounded-md border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                aria-label="Decrease Font Size"
              >
                A-
              </button>
              <span className="text-xs font-mono">{textSize}px</span>
              <button 
                id="btn-font-increase"
                onClick={() => setTextSize(Math.min(32, textSize + 2))}
                className="w-6 h-6 flex items-center justify-center font-bold text-sm bg-white dark:bg-zinc-900 rounded-md border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                aria-label="Increase Font Size"
              >
                A+
              </button>
            </div>
            
            {/* Speech Rate Slider */}
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800">
              <Sliders className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Speech Rate:</span>
              <input 
                id="slider-speech-rate"
                type="range" 
                min="0.6" 
                max="2.0" 
                step="0.1" 
                value={speechRate} 
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-16 cursor-pointer"
                aria-label="Adjust narration speed"
              />
              <span className="text-xs font-mono">{speechRate}x</span>
            </div>

            {/* Narration Voice Selector */}
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800">
              <Languages className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs font-bold">Voice:</span>
              <select
                id="voice-header-select"
                value={selectedVoiceName}
                onChange={(e) => {
                  setSelectedVoiceName(e.target.value);
                  // Preview the voice change
                  if (synthRef.current) {
                    synthRef.current.cancel();
                    const preview = new SpeechSynthesisUtterance("Voice updated.");
                    const selectedVoiceObj = window.speechSynthesis.getVoices().find(v => v.name === e.target.value);
                    if (selectedVoiceObj) preview.voice = selectedVoiceObj;
                    preview.rate = speechRate;
                    synthRef.current.speak(preview);
                  }
                }}
                className={`p-0.5 text-xs rounded border bg-transparent cursor-pointer max-w-[130px] truncate ${
                  isHighContrastDark 
                    ? 'border-zinc-700 text-yellow-300' 
                    : 'border-zinc-300 text-zinc-800'
                }`}
                aria-label="Select Narration Voice"
              >
                {voices.length === 0 ? (
                  <option value="">System Default</option>
                ) : (
                  voices.map((voice) => (
                    <option key={voice.name} value={voice.name} className="text-zinc-900 bg-white">
                      {voice.name} ({voice.lang})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-300 dark:border-zinc-800 mb-6" role="tablist">
          <button
            id="tab-reader"
            role="tab"
            aria-selected={activeTab === 'reader'}
            onClick={() => setActiveTab('reader')}
            className={`py-3 px-6 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'reader'
                ? isHighContrastDark ? 'border-yellow-400 text-yellow-400' : 'border-zinc-950 text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            1. Document Reader
          </button>
          <button
            id="tab-brainstorm"
            role="tab"
            aria-selected={activeTab === 'brainstorm'}
            onClick={() => setActiveTab('brainstorm')}
            className={`py-3 px-6 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'brainstorm'
                ? isHighContrastDark ? 'border-yellow-400 text-yellow-400' : 'border-zinc-950 text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            2. Business Model & Strategy
          </button>
          <button
            id="tab-embosser"
            role="tab"
            aria-selected={activeTab === 'embosser'}
            onClick={() => setActiveTab('embosser')}
            className={`py-3 px-6 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'embosser'
                ? isHighContrastDark ? 'border-yellow-400 text-yellow-400' : 'border-zinc-950 text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <FileCode className="w-4 h-4" />
            3. Embosser & Tactile Spec
          </button>
        </div>

        {/* Tab 1: Reader Workspace */}
        {activeTab === 'reader' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sidebar / Document Uploading Controls */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Upload Panel */}
              <section 
                id="sec-upload-box"
                className={`p-5 rounded-xl border-2 border-dashed transition-all ${
                  isHighContrastDark 
                    ? 'border-zinc-800 bg-black hover:border-yellow-400' 
                    : 'border-zinc-300 bg-white hover:border-zinc-500 shadow-xs'
                }`}
              >
                <h2 className="font-bold text-sm tracking-wide mb-3 uppercase flex items-center gap-2">
                  <Upload className="w-4 h-4 text-zinc-500" />
                  Process Technical PDF
                </h2>

                {/* PDF Parser Engine Selector */}
                <div className="mb-4">
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    PDF Parsing Technology:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setParserMode('local')}
                      className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                        parserMode === 'local'
                          ? isHighContrastDark 
                            ? 'bg-yellow-400 border-yellow-400 text-black font-extrabold' 
                            : 'bg-zinc-900 border-zinc-900 text-white font-bold shadow-sm'
                          : isHighContrastDark
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                      }`}
                    >
                      <div className="text-xs flex items-center gap-1.5">
                        <CheckCircle className={`w-3.5 h-3.5 ${parserMode === 'local' ? 'opacity-100' : 'opacity-20'}`} />
                        <span>Instant Local</span>
                      </div>
                      <p className="text-[9px] mt-1 opacity-80 leading-tight">Extracts text & math structures inside your browser in real-time.</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setParserMode('gemini')}
                      className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                        parserMode === 'gemini'
                          ? isHighContrastDark 
                            ? 'bg-yellow-400 border-yellow-400 text-black font-extrabold' 
                            : 'bg-zinc-900 border-zinc-900 text-white font-bold shadow-sm'
                          : isHighContrastDark
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                      }`}
                    >
                      <div className="text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gemini AI</span>
                      </div>
                      <p className="text-[9px] mt-1 opacity-80 leading-tight">Extracts tactile SVGs, tables, and diagram descriptions.</p>
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center relative">
                  <Volume2 className="w-8 h-8 text-zinc-400 mb-2" />
                  <p className="text-xs font-semibold mb-3">Upload your math homework or science PDF</p>
                  
                  <input 
                    id="pdf-file-selector"
                    type="file" 
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Select custom scientific paper or homework PDF"
                  />
                  
                  <button 
                    type="button"
                    className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-xs px-4 py-2 rounded hover:opacity-90"
                    tabIndex={-1}
                  >
                    Select File
                  </button>
                  <p className="text-[10px] text-zinc-500 mt-2">
                    {parserMode === 'local' 
                      ? "Runs instantly in-browser. Zero server delays, fully private & real-time."
                      : "Up to 25MB. Analyzed layout and math logic via server-side Gemini API."}
                  </p>
                </div>

                {isConverting && (
                  <div className="mt-4 p-3 rounded-lg bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100 text-xs font-semibold flex items-center gap-2 animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>
                      {parserMode === 'local' 
                        ? "Extracting PDF text structures locally... Please wait."
                        : "Analyzing PDF layout & math logic using Gemini... Please wait."}
                    </span>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100 text-xs font-semibold flex items-center gap-2 border border-red-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </section>

              {/* Web URL Panel */}
              <section 
                id="sec-url-box"
                className={`p-5 rounded-xl border transition-all ${
                  isHighContrastDark 
                    ? 'border-zinc-800 bg-black' 
                    : 'border-zinc-200 bg-white shadow-xs'
                }`}
              >
                <h2 className="font-bold text-sm tracking-wide mb-2 uppercase flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-emerald-500" />
                  Read Webpage or Article URL
                </h2>
                <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
                  Enter any website, documentation, or online article link. Our parser will extract the content in real-time, sifting layout noise automatically.
                </p>
                <form onSubmit={handleUrlSubmit} className="flex flex-col gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. en.wikipedia.org/wiki/Squeeze_theorem"
                      value={webpageUrl}
                      onChange={(e) => setWebpageUrl(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none transition-all ${
                        isHighContrastDark
                          ? 'bg-zinc-950 border-zinc-800 text-yellow-300 focus:border-yellow-400'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-zinc-400'
                      }`}
                      aria-label="Webpage Article URL"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isConverting || !webpageUrl.trim()}
                    className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !webpageUrl.trim()
                        ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 text-zinc-400'
                        : isHighContrastDark
                          ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-extrabold'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Fetch & Convert Website</span>
                  </button>
                </form>
              </section>

              {/* Sample Papers Library */}
              <section 
                id="sec-sample-library"
                className={`p-5 rounded-xl border transition-all ${
                  isHighContrastDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white shadow-xs'
                }`}
              >
                <h2 className="font-bold text-sm tracking-wide mb-3 uppercase text-zinc-500">
                  Try Pre-Loaded Samples
                </h2>
                <div className="flex flex-col gap-2.5">
                  <button 
                    id="btn-sample-1"
                    onClick={() => loadSample(1)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      fileName === 'Multi_Sensory_Paper_Converter_Abstract.pdf'
                        ? isHighContrastDark 
                          ? 'border-yellow-400 bg-zinc-900 text-yellow-300' 
                          : 'border-zinc-900 bg-zinc-50 font-bold shadow-sm'
                        : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Accessibility Paper (Abstract)</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-2">"A Multi-Sensory Science Paper Converter for Blind and Low-Vision Researchers"</p>
                  </button>

                  <button 
                    id="btn-sample-2"
                    onClick={() => loadSample(2)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      fileName === 'Calculus_Limits_Homework.pdf'
                        ? isHighContrastDark 
                          ? 'border-yellow-400 bg-zinc-900 text-yellow-300' 
                          : 'border-zinc-900 bg-zinc-50 font-bold shadow-sm'
                        : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Advanced Calculus Homework</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-2">Limits, Squeeze Theorems, and approximating Riemann Definite Integrals.</p>
                  </button>

                  <button 
                    id="btn-sample-3"
                    onClick={() => loadSample(3)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      fileName === 'Neural_Network_Architecture.pdf'
                        ? isHighContrastDark 
                          ? 'border-yellow-400 bg-zinc-900 text-yellow-300' 
                          : 'border-zinc-900 bg-zinc-50 font-bold shadow-sm'
                        : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Deep Neural Network Progression</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-2">Feedforward layers, Activation matrices, and Accuracy Benchmarks.</p>
                  </button>
                </div>
              </section>

              {/* Speech Engine Controller */}
              <section 
                id="sec-speech-controls"
                className={`p-5 rounded-xl border transition-all ${
                  isHighContrastDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white shadow-xs'
                }`}
              >
                <h2 className="font-bold text-sm tracking-wide mb-3 uppercase text-zinc-500">
                  Document Narration Engine
                </h2>
                
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <button
                    id="btn-nav-prev"
                    onClick={() => navigateBlock('prev')}
                    className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded flex justify-center items-center cursor-pointer"
                    title="Previous Block (Up Arrow)"
                    aria-label="Previous block"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    id="btn-speech-play"
                    onClick={togglePlayPause}
                    className={`p-2 rounded flex justify-center items-center cursor-pointer font-bold ${
                      isPlaying 
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-100' 
                        : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-100'
                    }`}
                    title="Play / Pause Spacebar"
                    aria-label={isPlaying ? "Pause narrative" : "Play narrative"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    id="btn-speech-stop"
                    onClick={stopSpeech}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-100 rounded flex justify-center items-center cursor-pointer"
                    title="Stop Playback (Escape)"
                    aria-label="Stop narrative"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                  <button
                    id="btn-nav-next"
                    onClick={() => navigateBlock('next')}
                    className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded flex justify-center items-center cursor-pointer"
                    title="Next Block (Down Arrow)"
                    aria-label="Next block"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <input 
                    id="chk-continuous-reading"
                    type="checkbox" 
                    checked={continuousRead} 
                    onChange={(e) => setContinuousRead(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="chk-continuous-reading" className="font-semibold cursor-pointer">Continuous Auto-Advance Reading</label>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-1.5 text-xs">
                  <label htmlFor="voice-sidebar-select" className="font-bold text-zinc-500 uppercase tracking-wide">
                    Narration Voice Accent:
                  </label>
                  <select
                    id="voice-sidebar-select"
                    value={selectedVoiceName}
                    onChange={(e) => {
                      setSelectedVoiceName(e.target.value);
                      // Play a tiny preview
                      if (synthRef.current) {
                        synthRef.current.cancel();
                        const testUtterance = new SpeechSynthesisUtterance("Voice updated.");
                        const selectedVoiceObj = window.speechSynthesis.getVoices().find(v => v.name === e.target.value);
                        if (selectedVoiceObj) testUtterance.voice = selectedVoiceObj;
                        testUtterance.rate = speechRate;
                        synthRef.current.speak(testUtterance);
                      }
                    }}
                    className={`p-2 rounded-md border text-xs cursor-pointer ${
                      isHighContrastDark 
                        ? 'bg-zinc-900 border-zinc-700 text-yellow-300 focus:border-yellow-400' 
                        : 'bg-white border-zinc-300 text-zinc-800 focus:border-zinc-500 shadow-xs'
                    }`}
                  >
                    {voices.length === 0 ? (
                      <option value="">System Default Voice</option>
                    ) : (
                      voices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-[10px] text-zinc-500 italic mt-1 leading-relaxed">
                    Browser-supported voices are shown. For more natural phrasing, choose a <strong>Google Natural</strong>, <strong>Siri</strong>, or <strong>Microsoft</strong> voice if listed.
                  </p>
                </div>
              </section>

              {/* Help & Hotkeys */}
              <section className="text-xs text-zinc-500 flex flex-col gap-1 px-2">
                <p className="font-bold uppercase text-[10px] tracking-wide mb-1 text-zinc-400">Keyboard Assist Hotkeys:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
                  <div>[Spacebar]</div><div>Play / Pause</div>
                  <div>[ArrowDown]</div><div>Next Item</div>
                  <div>[ArrowUp]</div><div>Prev Item</div>
                  <div>[Escape]</div><div>Stop Speech</div>
                  <div>[S] Key</div><div>Re-speak Current</div>
                </div>
              </section>

            </div>

            {/* Main Reading Workspace */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {convertedResult ? (
                <div className="flex flex-col gap-6">
                  {/* Paper Header */}
                  <header 
                    id="doc-header-card"
                    className={`p-6 rounded-xl border transition-all ${
                      isHighContrastDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white shadow-xs'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                      Active Multi-Sensory Document Package
                    </div>
                    <h2 id="paper-title" className="font-extrabold text-2xl lg:text-3xl leading-snug tracking-tight mb-3">
                      {convertedResult.metadata.title}
                    </h2>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {convertedResult.metadata.authors.map((author, index) => (
                        <span 
                          key={index} 
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            isHighContrastDark ? 'bg-zinc-900 text-yellow-300' : 'bg-zinc-100 text-zinc-800'
                          }`}
                        >
                          {author}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-1">Abstract</h3>
                      <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">{convertedResult.metadata.abstract}</p>
                    </div>
                  </header>

                  {/* Accessible Block Listing */}
                  <div className="flex flex-col gap-4">
                    {convertedResult.blocks.map((block, index) => {
                      const isActive = index === activeBlockIndex;
                      
                      return (
                        <div 
                          key={block.id}
                          ref={(el) => { blockRefs.current[index] = el; }}
                          onClick={() => speakBlock(index)}
                          className={`p-5 rounded-xl border cursor-pointer transition-all relative ${
                            isActive 
                              ? isHighContrastDark 
                                ? 'border-yellow-400 bg-zinc-950 ring-2 ring-yellow-400' 
                                : 'border-zinc-950 bg-[#fffdf0] ring-2 ring-zinc-950'
                              : isHighContrastDark 
                                ? 'border-zinc-800 bg-black hover:border-zinc-700' 
                                : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-xs'
                          }`}
                        >
                          {/* Top-right indicator / Play indicator */}
                          <div className="absolute top-4 right-4 flex items-center gap-2">
                            {isActive && isPlaying && (
                              <span className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                            )}
                            <span className="text-[10px] font-mono uppercase bg-zinc-100 dark:bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded font-bold">
                              {index + 1} / {convertedResult.blocks.length} : {block.type}
                            </span>
                          </div>

                          {/* Block Rendering based on Type */}
                          {block.type === 'heading' && (
                            <div className="pr-16">
                              {block.content.level === 1 ? (
                                <h3 className="font-extrabold text-xl lg:text-2xl mt-1">{block.content.text}</h3>
                              ) : block.content.level === 2 ? (
                                <h4 className="font-extrabold text-lg lg:text-xl mt-1">{block.content.text}</h4>
                              ) : (
                                <h5 className="font-bold text-base mt-1">{block.content.text}</h5>
                              )}
                            </div>
                          )}

                          {block.type === 'prose' && (
                            <p className="leading-relaxed mt-1 pr-16">{block.content.text}</p>
                          )}

                          {block.type === 'equation' && (
                            <div className="mt-1 flex flex-col gap-3 pr-16">
                              <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto text-center">
                                <code className="text-sm lg:text-base font-mono text-emerald-600 dark:text-emerald-400">
                                  {block.content.latex}
                                </code>
                              </div>
                              <div className="p-3 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100 rounded-lg border border-emerald-100 dark:border-emerald-950 flex items-start gap-2.5">
                                <Volume2 className="w-4.5 h-4.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h5 className="text-[11px] font-bold uppercase tracking-wider mb-0.5">Spoken Math Logic (Narrated Voice)</h5>
                                  <p className="text-xs leading-relaxed">{block.content.spoken_logic}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {block.type === 'figure' && (
                            <div className="mt-1 flex flex-col gap-4 pr-16">
                              {/* Caption */}
                              <div className="text-xs font-semibold text-zinc-500 italic">
                                {block.content.original_caption}
                              </div>

                              {/* Simplified High-Contrast Swell-Ready Visual Node */}
                              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
                                <div className="text-[10px] font-mono text-zinc-500 uppercase font-semibold mb-2 flex items-center gap-1.5">
                                  <Maximize2 className="w-3 h-3" />
                                  Tactile Vector Map (Feel & Print Spec)
                                </div>
                                <div 
                                  className="w-full h-auto max-h-[250px] flex items-center justify-center"
                                  dangerouslySetInnerHTML={{ __html: block.content.tactile_svg || '' }}
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadSVG(block.content.tactile_svg || '', block.id);
                                  }}
                                  className="mt-3 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 font-extrabold text-[10px] rounded flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <Download className="w-3 h-3" />
                                  Download Swell-Paper SVG
                                </button>
                              </div>

                              {/* Semantic figure breakdown */}
                              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col gap-2">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                  Semantic Figure Summary
                                </h5>
                                <div className="text-xs font-semibold mb-1 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <Info className="w-3.5 h-3.5" />
                                  <span>Alt Text: {block.content.alt_text}</span>
                                </div>
                                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                                  {block.content.semantic_summary}
                                </p>
                              </div>
                            </div>
                          )}

                          {block.type === 'table' && (
                            <div className="mt-1 flex flex-col gap-4 pr-16">
                              <div className="text-xs font-semibold text-zinc-500 italic">
                                {block.content.caption}
                              </div>

                              {/* Markdown Table structured display */}
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 border dark:border-zinc-800 text-xs text-left">
                                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {block.content.markdown?.split('\n').filter(line => line.trim() && !line.includes('|---|')).map((line, rIdx) => {
                                      const cols = line.split('|').map(c => c.trim()).filter(c => c !== '');
                                      if (cols.length === 0) return null;
                                      
                                      const isHeader = rIdx === 0;
                                      return (
                                        <tr key={rIdx} className={isHeader ? 'bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-white' : 'hover:bg-zinc-50 dark:hover:bg-zinc-950'}>
                                          {cols.map((col, cIdx) => (
                                            <td key={cIdx} className="px-3 py-2 border-r dark:border-zinc-800 font-semibold">{col}</td>
                                          ))}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                  Data Summary for Screen Readers
                                </h5>
                                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                                  {block.content.summary}
                                </p>
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <Volume2 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">No Document Processed</h3>
                  <p className="text-sm text-zinc-500 max-w-md mx-auto">
                    Please upload an academic PDF paper or select one of our pre-loaded mathematical homework samples to experience fully automated multi-sensory reading.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 2: Business Model, Strategy, and Entrepreneurship Brainstorm */}
        {activeTab === 'brainstorm' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-6xl mx-auto">
            
            {/* Sidebar with core value proposition */}
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="p-6 rounded-xl bg-zinc-900 text-white border border-zinc-800 flex flex-col gap-4">
                <h3 className="font-bold text-sm tracking-widest uppercase text-yellow-400">Value Proposition</h3>
                <h4 className="font-extrabold text-2xl leading-tight">Zero Sighted Assistance Needed</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Right now, blind university researchers wait <strong>2 to 4 weeks</strong> and universities spend <strong>thousands of dollars</strong> for manual transcribers to describe math diagrams and emboss graphs.
                </p>
                <div className="bg-zinc-800/60 p-4 rounded-lg border border-zinc-700/50">
                  <p className="text-xs font-bold mb-1 flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    Our Multi-Sensory Tech:
                  </p>
                  <ul className="text-[11px] text-zinc-300 list-disc list-inside space-y-1">
                    <li>Completed in under 30 seconds</li>
                    <li>0 cents of manual drafting cost</li>
                    <li>Directly generates embosser SVGs</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
                <h3 className="font-bold text-xs uppercase text-zinc-400 mb-3 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" />
                  Is there competition?
                </h3>
                <div className="flex flex-col gap-3 text-xs leading-relaxed">
                  <p>
                    <strong>Mathpix Snip</strong> parses LaTeX equations perfectly, but is designed 100% for <em>sighted</em> programmers/writers to copy code — it does not read them out hierarchically or describe drawings.
                  </p>
                  <p>
                    <strong>EquatIO</strong> inserts math, but lacks a full document layout segmentation reader or dedicated tactile vector creators.
                  </p>
                  <p>
                    <strong>Academic Prototypes (e.g., Kanak)</strong> are research papers but lack public commercial platforms or accessible, self-serve client integrations.
                  </p>
                </div>
              </div>
            </div>

            {/* Strategy, Revenue, and Bootstrapping Matrix */}
            <div className="md:col-span-8 flex flex-col gap-8">
              
              <section className="flex flex-col gap-4">
                <h2 className="font-extrabold text-2xl tracking-tight flex items-center gap-2">
                  <Sparkles className="text-yellow-500 w-6 h-6" />
                  How to Build a High-Growth Accessibility SaaS
                </h2>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  The digital accessibility market is projected to reach <strong>$35 Billion by 2030</strong>. Driven by legislation (ADA Title II/III, EU Accessibility Act), schools and scientific publishers are legally required to achieve compliance. Here is a blueprint to monetize this application without upfront spending:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  
                  {/* B2B University Sales */}
                  <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">Channel 1 (Primary Margin)</span>
                    <h4 className="font-bold text-base flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      University Disability Offices
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Sell annual campus licenses ($10k - $50k/year) directly to university accessibility and STEM service offices. Schools can parse class homework, textbook chapters, and student handouts instantly.
                    </p>
                  </div>

                  {/* Scientific Publishers */}
                  <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400">Channel 2 (Enterprise API)</span>
                    <h4 className="font-bold text-base flex items-center gap-1">
                      <FileCode className="w-4 h-4" />
                      Publisher API Portals
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Partner with publishers (Elsevier, IEEE, Springer) to ingest published articles. Feed them our pipeline to instantly yield a secondary "Multi-Sensory Audio/Tactile Version" widget alongside standard PDFs.
                    </p>
                  </div>

                  {/* Individual SaaS Subscriptions */}
                  <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">Channel 3 (B2C Volume)</span>
                    <h4 className="font-bold text-base flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Premium Researcher Subscriptions
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Provide a free tier (2 documents/month) for individual blind graduate students, then offer a premium subscription ($19 - $49/month) for unlimited document conversion and durable cloud cloud library storage.
                    </p>
                  </div>

                  {/* Government Grants */}
                  <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">Channel 4 (Non-Dilutive Funding)</span>
                    <h4 className="font-bold text-base flex items-center gap-1">
                      <ExternalLink className="w-4 h-4" />
                      NSF / NIH Grants
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Apply for SBIR (Small Business Innovation Research) grants under the National Science Foundation (NSF) accessibility/education tracks. These give up to $275k of completely free, equity-free funding to develop accessibility tech.
                    </p>
                  </div>

                </div>
              </section>

              <section className="flex flex-col gap-4 p-5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800">
                <h3 className="font-bold text-base">Cost-Free Bootstrapping Guide (Fast & Efficient)</h3>
                <div className="space-y-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <p>
                    <strong>1. Core Model (Zero Cost):</strong> Use <strong>Gemini 1.5/3.5 Flash</strong>. It features native multimodal PDF ingestion and very low latency. It is exceptionally cost-effective with high free-tier quotas.
                  </p>
                  <p>
                    <strong>2. Cloud Hosting (Zero Cost):</strong> Host your server on <strong>Render</strong> or <strong>Google Cloud Run free allowances</strong>, and manage frontends via <strong>Vercel</strong>.
                  </p>
                  <p>
                    <strong>3. Persistence (Zero Cost):</strong> Use <strong>Firebase Firestore (Free Tier)</strong> to store parsed pages and synthesized SVGs, meaning you pay $0 for database storage until you reach 50,000 document reads a day.
                  </p>
                  <p>
                    <strong>4. Built-in Client Speech (Zero Cost):</strong> Utilize the browser's native Web Speech API (`window.speechSynthesis`) instead of paid commercial TTS servers (e.g. Amazon Polly or ElevenLabs). Browser-native voice reads instantly on the device, has zero network latency, is 100% free, and perfectly respects the user's customized local voice settings!
                  </p>
                </div>
              </section>

            </div>

          </div>
        )}

        {/* Tab 3: Embosser SVG spec documentation */}
        {activeTab === 'embosser' && (
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <section className={`p-6 rounded-xl border transition-all ${
              isHighContrastDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white shadow-xs'
            }`}>
              <h2 className="font-extrabold text-2xl mb-3 flex items-center gap-2">
                <FileCode className="text-emerald-500 w-6 h-6" />
                Swell-Paper & Tactile Embosser Layout Specifications
              </h2>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                To create tactile diagrams that blind researchers can "read" with their fingertips, the exported SVG maps must follow strict design rules. Standard SVG vector charts must be heavily simplified. This panel outlines the automated design decisions made by our generative vision model:
              </p>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800">
                    <h4 className="font-bold mb-1 text-zinc-700 dark:text-zinc-300">1. Line Contrast & Weight</h4>
                    <p className="text-zinc-500">Every vector path uses stroke-widths between 3px and 6px. Thin lines fail to puff up on micro-capsule swell heaters, resulting in unfeelable graphics.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800">
                    <h4 className="font-bold mb-1 text-zinc-700 dark:text-zinc-300">2. Pattern Spacing</h4>
                    <p className="text-zinc-500">Charts must avoid solid dark gradients. Solid black expands too much, burning the swell paper. We replace fills with high-contrast dash patterns or sparse grids.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800">
                    <h4 className="font-bold mb-1 text-zinc-700 dark:text-zinc-300">3. Spatial Labeling</h4>
                    <p className="text-zinc-500">Labels are placed outside visual shapes, rendered in spacious monospace text or Unicode Braille (e.g. ⠇⠕⠎⠎ for loss), allowing tactile reading without shape overlap.</p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-zinc-900 text-zinc-300 font-mono">
                  <p className="text-xs text-yellow-400 font-bold mb-2">// Sample Embosser-Ready SVG Markup produced by pipeline:</p>
                  <pre className="text-[10px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%">
  <!-- Tactile bounding frame -->
  <rect width="100%" height="100%" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>
  <!-- Bold high-contrast data curve -->
  <path d="M 50 350 Q 200 150, 450 100" fill="none" stroke="#000000" stroke-width="5" stroke-dasharray="10 5"/>
  <!-- Outer Braille-font Axis Label -->
  <text x="250" y="380" font-family="monospace" font-size="16" text-anchor="middle">⠁⠭⠊⠎ (AXIS)</text>
</svg>`}
                  </pre>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className={`mt-16 border-t px-4 py-8 text-center text-xs transition-colors ${
        isHighContrastDark ? 'border-zinc-800 bg-black text-zinc-500' : 'border-zinc-200 bg-zinc-50 text-zinc-500'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Multi-Sensory Document Accessibility Project. Built for immediate screen-reader and embosser compatibility.</p>
          <div className="flex gap-4">
            <span className="font-semibold">Vocal-Enabled UX</span>
            <span>•</span>
            <span className="font-semibold">Swell-Paper Compatible SVGs</span>
            <span>•</span>
            <span className="font-semibold">Gemini 3.5 Flash Powered</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

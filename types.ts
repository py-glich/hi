/**
 * Core Application TypeScript Types
 */

export interface Metadata {
  title: string;
  authors: string[];
  abstract: string;
}

export interface Block {
  id: string;
  type: 'heading' | 'prose' | 'equation' | 'figure' | 'table';
  content: {
    text?: string;
    level?: number;
    latex?: string;
    spoken_logic?: string;
    original_caption?: string;
    alt_text?: string;
    semantic_summary?: string;
    tactile_svg?: string;
    caption?: string;
    markdown?: string;
    summary?: string;
  };
}

export interface ConversionResult {
  metadata: Metadata;
  blocks: Block[];
}

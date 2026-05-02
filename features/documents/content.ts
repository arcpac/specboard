export type TiptapDocumentContent = Record<string, unknown>;

export type TextDocumentBlock = {
  id: string;
  type: "text";
  content: {
    tiptap: TiptapDocumentContent;
  };
};

export type ImageDocumentBlock = {
  id: string;
  type: "image";
  content: {
    src: string;
    alt: string;
    caption: string;
  };
};

export type TableDocumentBlock = {
  id: string;
  type: "table";
  content: {
    rows: string[][];
  };
};

export type DocumentBlock =
  | TextDocumentBlock
  | ImageDocumentBlock
  | TableDocumentBlock;

export type DocumentPageContent = {
  id: string;
  blocks: DocumentBlock[];
};

export type BlockDocumentContent = {
  version: 2;
  type: "block-document";
  pages: DocumentPageContent[];
};

type LegacyPaginatedDocumentContent = {
  version: 1;
  type: "specboard.paginated-document";
  pages: unknown[];
};

const BLOCK_DOCUMENT_TYPE = "block-document";
const BLOCK_DOCUMENT_VERSION = 2;
const LEGACY_PAGINATED_DOCUMENT_TYPE = "specboard.paginated-document";
const LEGACY_PAGINATED_DOCUMENT_VERSION = 1;

export const EMPTY_TIPTAP_DOCUMENT: TiptapDocumentContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

export function createDefaultTextBlock(
  tiptap: TiptapDocumentContent = EMPTY_TIPTAP_DOCUMENT,
): TextDocumentBlock {
  return {
    id: createDocumentBlockId(),
    type: "text",
    content: {
      tiptap: cloneRecord(tiptap),
    },
  };
}

export function createDefaultImageBlock(): ImageDocumentBlock {
  return {
    id: createDocumentBlockId(),
    type: "image",
    content: {
      src: "",
      alt: "",
      caption: "",
    },
  };
}

export function createDefaultTableBlock(): TableDocumentBlock {
  return {
    id: createDocumentBlockId(),
    type: "table",
    content: {
      rows: [
        ["Column 1", "Column 2", "Column 3"],
        ["", "", ""],
        ["", "", ""],
      ],
    },
  };
}

export function createEmptyDocumentPage(): DocumentPageContent {
  return {
    id: createDocumentPageId(),
    blocks: [createDefaultTextBlock()],
  };
}

export function createEmptyDocumentContent(): BlockDocumentContent {
  return createBlockDocumentContent([createEmptyDocumentPage()]);
}

export function createBlockDocumentContent(
  pages: DocumentPageContent[],
): BlockDocumentContent {
  return {
    version: BLOCK_DOCUMENT_VERSION,
    type: BLOCK_DOCUMENT_TYPE,
    pages: pages.length > 0 ? pages : [createEmptyDocumentPage()],
  };
}

export function normalizeDocumentPages(
  contentJson: Record<string, unknown>,
): DocumentPageContent[] {
  if (isBlockDocumentContent(contentJson)) {
    const pages = contentJson.pages
      .map((page) => normalizeBlockDocumentPage(page))
      .filter((page): page is DocumentPageContent => page !== null);

    if (pages.length > 0) {
      return pages;
    }
  }

  if (isLegacyPaginatedDocument(contentJson)) {
    const pages = contentJson.pages
      .map((page) => normalizeLegacyDocumentPage(page))
      .filter((page): page is DocumentPageContent => page !== null);

    if (pages.length > 0) {
      return pages;
    }
  }

  return [createLegacyPageFromTiptap(contentJson)];
}

function normalizeBlockDocumentPage(value: unknown): DocumentPageContent | null {
  if (!isRecord(value) || typeof value.id !== "string" || !Array.isArray(value.blocks)) {
    return null;
  }

  const blocks = value.blocks
    .map((block) => normalizeDocumentBlock(block))
    .filter((block): block is DocumentBlock => block !== null);

  return {
    id: value.id,
    blocks: blocks.length > 0 ? blocks : [createDefaultTextBlock()],
  };
}

function normalizeDocumentBlock(value: unknown): DocumentBlock | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.type !== "string") {
    return null;
  }

  switch (value.type) {
    case "text":
      if (!isRecord(value.content) || !isRecord(value.content.tiptap)) {
        return null;
      }

      return {
        id: value.id,
        type: "text",
        content: {
          tiptap: value.content.tiptap,
        },
      };
    case "image":
      if (!isRecord(value.content)) {
        return null;
      }

      return {
        id: value.id,
        type: "image",
        content: {
          src: typeof value.content.src === "string" ? value.content.src : "",
          alt: typeof value.content.alt === "string" ? value.content.alt : "",
          caption:
            typeof value.content.caption === "string" ? value.content.caption : "",
        },
      };
    case "table":
      if (!isRecord(value.content) || !Array.isArray(value.content.rows)) {
        return null;
      }

      return {
        id: value.id,
        type: "table",
        content: {
          rows: normalizeTableRows(value.content.rows),
        },
      };
    default:
      return null;
  }
}

function normalizeLegacyDocumentPage(value: unknown): DocumentPageContent | null {
  if (!isRecord(value) || typeof value.id !== "string" || !isRecord(value.contentJson)) {
    return null;
  }

  return {
    id: value.id,
    blocks: [createDefaultTextBlock(value.contentJson)],
  };
}

function createLegacyPageFromTiptap(contentJson: Record<string, unknown>): DocumentPageContent {
  return {
    id: createDocumentPageId(),
    blocks: [createDefaultTextBlock(contentJson)],
  };
}

function normalizeTableRows(rows: unknown[]): string[][] {
  const normalizedRows = rows
    .map((row) => {
      if (!Array.isArray(row)) {
        return null;
      }

      return row.map((cell) => (typeof cell === "string" ? cell : ""));
    })
    .filter((row): row is string[] => row !== null);

  return normalizedRows.length > 0
    ? normalizedRows
    : createDefaultTableBlock().content.rows;
}

function isBlockDocumentContent(value: Record<string, unknown>): value is BlockDocumentContent {
  return (
    value.type === BLOCK_DOCUMENT_TYPE &&
    value.version === BLOCK_DOCUMENT_VERSION &&
    Array.isArray(value.pages)
  );
}

function isLegacyPaginatedDocument(
  value: Record<string, unknown>,
): value is LegacyPaginatedDocumentContent {
  return (
    value.type === LEGACY_PAGINATED_DOCUMENT_TYPE &&
    value.version === LEGACY_PAGINATED_DOCUMENT_VERSION &&
    Array.isArray(value.pages)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneRecord<T extends Record<string, unknown>>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createDocumentPageId() {
  return globalThis.crypto?.randomUUID?.() ?? `page-${Date.now()}`;
}

export function createDocumentBlockId() {
  return globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}`;
}

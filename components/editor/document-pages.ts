export type DocumentPageContent = {
  id: string;
  contentJson: Record<string, unknown>;
};

const PAGINATED_DOCUMENT_TYPE = "specboard.paginated-document";
const PAGINATED_DOCUMENT_VERSION = 1;

export const EMPTY_DOCUMENT_PAGE_CONTENT = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

export function normalizeDocumentPages(
  contentJson: Record<string, unknown>,
): DocumentPageContent[] {
  if (
    contentJson.type === PAGINATED_DOCUMENT_TYPE &&
    contentJson.version === PAGINATED_DOCUMENT_VERSION &&
    Array.isArray(contentJson.pages)
  ) {
    const pages = contentJson.pages
      .map((page) => normalizePageContent(page))
      .filter((page): page is DocumentPageContent => page !== null);

    if (pages.length > 0) {
      return pages;
    }
  }

  return [
    {
      id: createDocumentPageId(),
      contentJson,
    },
  ];
}

export function createEmptyDocumentPage(): DocumentPageContent {
  return {
    id: createDocumentPageId(),
    contentJson: EMPTY_DOCUMENT_PAGE_CONTENT,
  };
}

export function syncActiveDocumentPage(
  pages: DocumentPageContent[],
  activePageIndex: number,
  activeContentJson: Record<string, unknown>,
) {
  if (pages.length === 0) {
    return [
      {
        id: createDocumentPageId(),
        contentJson: activeContentJson,
      },
    ];
  }

  return pages.map((page, index) =>
    index === activePageIndex
      ? {
          ...page,
          contentJson: activeContentJson,
        }
      : page,
  );
}

export function createPaginatedDocumentContent(
  pages: DocumentPageContent[],
  activePageIndex: number,
  activeContentJson: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: PAGINATED_DOCUMENT_TYPE,
    version: PAGINATED_DOCUMENT_VERSION,
    pages: syncActiveDocumentPage(pages, activePageIndex, activeContentJson),
  };
}

function normalizePageContent(value: unknown): DocumentPageContent | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  if (!isRecord(value.contentJson)) {
    return null;
  }

  return {
    id: value.id,
    contentJson: value.contentJson,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createDocumentPageId() {
  return globalThis.crypto?.randomUUID?.() ?? `page-${Date.now()}`;
}

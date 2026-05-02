"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import type { Editor } from "@tiptap/react";
import { Image as ImageIcon, Plus, Table2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createTaskFromSelectionAction } from "@/features/tasks/actions";
import { saveDocumentAction } from "@/features/documents/actions";
import {
  createBlockDocumentContent,
  createDefaultImageBlock,
  createDefaultTableBlock,
  createDefaultTextBlock,
  createDocumentPageId,
  createEmptyDocumentPage,
  normalizeDocumentPages,
  type DocumentBlock,
  type DocumentPageContent,
  type ImageDocumentBlock,
  type TableDocumentBlock,
  type TextDocumentBlock,
} from "@/features/documents/content";
import { DocumentBlockRenderer } from "@/components/editor/blocks/document-block-renderer";
import type {
  ImageBlockChangeHandler,
  TableBlockChangeHandler,
  TextBlockChangeHandler,
} from "@/components/editor/blocks/types";
import { EditorPageHeader } from "./editor-page-header";
import { EditorPageControls } from "./editor-page-controls";
import { EditorPagesPanel } from "./editor-pages-panel";
import { EditorToolbar } from "./editor-toolbar";
import { EditorRightSidebar } from "./editor-right-sidebar";
import type { EditorLinkedTask } from "./editor-store";
import { useEditorStore } from "./editor-store";

type InsertableBlockType = DocumentBlock["type"];
type BlockInsertionSide = "above" | "below";
type HoverInsertionTarget = {
  blockId: string;
  side: BlockInsertionSide;
};
type BlockInsertOptions = {
  relativeToBlockId?: string;
  side?: BlockInsertionSide;
};
type DocumentPaperLayout = {
  widthMm: number;
  heightMm: number;
  paddingXMm: number;
  paddingYMm: number;
};

const DEFAULT_DOCUMENT_PAPER_LAYOUT: DocumentPaperLayout = {
  widthMm: 210,
  heightMm: 297,
  paddingXMm: 22,
  paddingYMm: 24,
};
const DEFAULT_DOCUMENT_BLOCK_GAP_PX = 24;
const DOCUMENT_PAGE_FLOW_SELECTOR = "[data-page-flow]";
const DOCUMENT_PAGE_BLOCKS_SELECTOR = "[data-page-blocks]";
const DOCUMENT_BLOCK_SELECTOR = "[data-document-block-id]";
const DOCUMENT_PAPER_STACK_STYLE = getPaperStackStyle(DEFAULT_DOCUMENT_PAPER_LAYOUT);

export function RichTextEditor({
  workspaceSlug,
  documentId,
  title,
  onTitleChange,
  lastSavedLabel,
  initialContent,
  canEdit,
  linkedTasks,
  onSaved,
}: {
  workspaceSlug: string;
  documentId: string;
  title: string;
  onTitleChange: (title: string) => void;
  lastSavedLabel: string;
  initialContent: Record<string, unknown>;
  canEdit: boolean;
  linkedTasks: EditorLinkedTask[];
  onSaved: (updatedAt: string) => void;
}) {
  const router = useRouter();
  const [documentPages, setDocumentPages] = useState<DocumentPageContent[]>(() =>
    normalizeDocumentPages(initialContent),
  );
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [pendingFocusBlockId, setPendingFocusBlockId] = useState<string | null>(null);
  const [paginationRevision, setPaginationRevision] = useState(0);
  const pageElementsRef = useRef(new Map<string, HTMLDivElement>());
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const activeBlockIdRef = useRef<string | null>(null);
  const [selectionText, setSelectionText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isTaskPending, startTaskTransition] = useTransition();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const setEditorSelectionText = useEditorStore((state) => state.setSelectionText);
  const setEditorLinkedTasks = useEditorStore((state) => state.setLinkedTasks);
  const toggleRightSidebar = useEditorStore((state) => state.toggleRightSidebar);

  useEffect(() => {
    setEditorLinkedTasks(linkedTasks);
  }, [linkedTasks, setEditorLinkedTasks]);

  useEffect(() => {
    const pagesContainerElement = pagesContainerRef.current;

    if (!pagesContainerElement) {
      return;
    }

    let frameId: number | null = null;

    const queuePagination = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        setPaginationRevision((currentRevision) => currentRevision + 1);
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      queuePagination();
    });
    const observedElements = [
      ...pageElementsRef.current.values(),
      ...pagesContainerElement.querySelectorAll<HTMLElement>(DOCUMENT_BLOCK_SELECTOR),
    ];

    observedElements.forEach((element) => {
      resizeObserver.observe(element);
    });

    queuePagination();
    window.addEventListener("resize", queuePagination);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      resizeObserver.disconnect();
      window.removeEventListener("resize", queuePagination);
    };
  }, [documentPages]);

  useLayoutEffect(() => {
    const nextPages = repaginateDocumentPages(documentPages, pageElementsRef.current);

    if (!nextPages || areDocumentPageAssignmentsEqual(documentPages, nextPages)) {
      return;
    }

    setDocumentPages(nextPages);
    setCurrentPageIndex((previousIndex) => {
      const activeBlockId = activeBlockIdRef.current;

      if (activeBlockId) {
        const nextIndex = nextPages.findIndex((page) =>
          page.blocks.some((block) => block.id === activeBlockId),
        );

        if (nextIndex >= 0) {
          return nextIndex;
        }
      }

      return clamp(previousIndex, 0, Math.max(nextPages.length - 1, 0));
    });

    const activeBlockId = activeBlockIdRef.current;

    if (
      activeBlockId &&
      findDocumentBlockById(nextPages, activeBlockId)?.type === "text"
    ) {
      setPendingFocusBlockId(activeBlockId);
    }
  }, [documentPages, paginationRevision]);

  function clearSelectionSnapshot() {
    setSelectionText("");
    setEditorSelectionText("");
  }

  function updateSelectionSnapshot(nextEditor: Editor) {
    const { from, to } = nextEditor.state.selection;
    const text = nextEditor.state.doc.textBetween(from, to, " ").trim();
    setSelectionText(text);
    setEditorSelectionText(text);
  }

  function focusPage(pageId: string) {
    const pageIndex = documentPages.findIndex((page) => page.id === pageId);

    if (pageIndex < 0) {
      return;
    }

    setCurrentPageIndex(pageIndex);
  }

  function handleAddPage(afterPageIndex: number) {
    if (!canEdit) {
      return;
    }

    const insertIndex = Math.min(afterPageIndex + 1, documentPages.length);
    const nextPage = createEmptyDocumentPage();

    setDocumentPages((currentPages) => [
      ...currentPages.slice(0, insertIndex),
      nextPage,
      ...currentPages.slice(insertIndex),
    ]);
    setCurrentPageIndex(insertIndex);
    setPendingFocusBlockId(nextPage.blocks[0]?.id ?? null);
    setFeedback("Page added.");
  }

  function handlePageSelect(pageId: string) {
    const pageIndex = documentPages.findIndex((page) => page.id === pageId);

    if (pageIndex < 0) {
      return;
    }

    const pageElement = pageElementsRef.current.get(pageId);

    setCurrentPageIndex(pageIndex);
    pageElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function updatePageBlock(
    pageId: string,
    blockId: string,
    updater: (block: DocumentBlock) => DocumentBlock,
  ) {
    setDocumentPages((currentPages) =>
      currentPages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              blocks: page.blocks.map((block) =>
                block.id === blockId ? updater(block) : block,
              ),
            }
          : page,
      ),
    );
  }

  function handleInsertBlock(
    pageId: string,
    blockType: InsertableBlockType,
    options?: BlockInsertOptions,
  ) {
    if (!canEdit) {
      return;
    }

    const nextBlock = createBlockByType(blockType);

    setDocumentPages((currentPages) =>
      currentPages.map((page) =>
        page.id === pageId
          ? (() => {
              const relativeBlockIndex = options?.relativeToBlockId
                ? page.blocks.findIndex(
                    (block) => block.id === options.relativeToBlockId,
                  )
                : -1;
              const insertIndex =
                relativeBlockIndex < 0
                  ? page.blocks.length
                  : options?.side === "above"
                    ? relativeBlockIndex
                    : relativeBlockIndex + 1;

              return {
                ...page,
                blocks: [
                  ...page.blocks.slice(0, insertIndex),
                  nextBlock,
                  ...page.blocks.slice(insertIndex),
                ],
              };
            })()
          : page,
      ),
    );

    focusPage(pageId);
    setActiveEditor(null);
    clearSelectionSnapshot();

    if (nextBlock.type === "text") {
      setPendingFocusBlockId(nextBlock.id);
    }

    setFeedback(`${formatBlockTypeLabel(nextBlock.type)} block inserted.`);
  }

  async function handleSave() {
    setFeedback(null);
    startSaveTransition(async () => {
      const result = await saveDocumentAction({
        workspaceSlug,
        documentId,
        title,
        contentJson: createBlockDocumentContent(documentPages),
      });

      if (!result.ok) {
        setFeedback(result.message ?? "Unable to save document.");
        return;
      }

      if (result.updatedAt) {
        onSaved(result.updatedAt);
      }

      setFeedback("Document saved.");
      router.refresh();
    });
  }

  async function handleCreateTask() {
    if (!selectionText.trim()) {
      setFeedback("Select some text in a text block before creating a task.");
      return;
    }

    setFeedback(null);
    startTaskTransition(async () => {
      const result = await createTaskFromSelectionAction({
        workspaceSlug,
        documentId,
        title: taskTitle.trim() || selectionText.trim().slice(0, 80),
        description: taskDescription,
        sourceExcerpt: selectionText.trim(),
        sourceHeading: title,
      });

      if (!result.ok) {
        setFeedback(result.message ?? "Unable to create task.");
        return;
      }

      setTaskDialogOpen(false);
      setTaskTitle("");
      setTaskDescription("");
      setFeedback("Task created from selection.");
      router.refresh();
    });
  }

  function handleLinkToggle() {
    if (!activeEditor || !canEdit) {
      return;
    }

    const existingHref = activeEditor.getAttributes("link").href as string | undefined;
    const url = window.prompt(
      "Enter a URL for the selected text. Leave empty to remove the link.",
      existingHref ?? "https://",
    );

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      activeEditor.chain().focus().unsetLink().run();
      return;
    }

    activeEditor.chain().focus().setLink({ href: url.trim() }).run();
  }

  function handleInsertTableBlock() {
    const currentPage = documentPages[currentPageIndex];

    if (!currentPage) {
      return;
    }

    handleInsertBlock(currentPage.id, "table");
  }

  return (
    <div className="-mx-6 grid h-dvh max-h-dvh grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-workspace">
      <EditorPageHeader
        title={title}
        onTitleChange={onTitleChange}
        canEdit={canEdit}
        lastSavedLabel={lastSavedLabel}
      >
        <EditorToolbar
          editor={activeEditor}
          canEdit={canEdit}
          feedback={feedback}
          isSaving={isSaving}
          isTaskPending={isTaskPending}
          selectionText={selectionText}
          taskTitle={taskTitle}
          taskDescription={taskDescription}
          taskDialogOpen={taskDialogOpen}
          onSave={handleSave}
          onToggleRightSidebar={toggleRightSidebar}
          onLinkToggle={handleLinkToggle}
          onInsertTableBlock={handleInsertTableBlock}
          onTaskDialogOpenChange={setTaskDialogOpen}
          onTaskTitleChange={setTaskTitle}
          onTaskDescriptionChange={setTaskDescription}
          onCreateTask={handleCreateTask}
        />
      </EditorPageHeader>
      <div className="relative flex min-h-0 min-w-0 overflow-hidden">
        <EditorPagesPanel
          pages={documentPages.map((page, index) => ({
            id: page.id,
            label: `Page ${index + 1}`,
          }))}
          currentPageId={documentPages[currentPageIndex]?.id}
          onPageSelect={handlePageSelect}
        />
        <main className="h-full min-w-0 flex-1 overflow-auto px-4 py-8 sm:px-8 lg:px-12">
          <div
            ref={pagesContainerRef}
            className="mx-auto flex shrink-0 flex-col items-center gap-4 pb-8"
            style={DOCUMENT_PAPER_STACK_STYLE}
          >
            {documentPages.map((page, index) => (
              <div key={page.id} className="contents">
                <EditorPaper
                  page={page}
                  canEdit={canEdit}
                  pageLayout={DEFAULT_DOCUMENT_PAPER_LAYOUT}
                  pendingFocusBlockId={pendingFocusBlockId}
                  onPendingFocusHandled={(blockId) => {
                    if (pendingFocusBlockId === blockId) {
                      setPendingFocusBlockId(null);
                    }
                  }}
                  onInsertBlock={handleInsertBlock}
                  onTextBlockChange={(blockId, tiptap) => {
                    updatePageBlock(page.id, blockId, (block) => ({
                      ...(block as TextDocumentBlock),
                      content: {
                        tiptap,
                      },
                    }));
                  }}
                  onImageBlockChange={(blockId, content) => {
                    updatePageBlock(page.id, blockId, (block) => ({
                      ...(block as ImageDocumentBlock),
                      content,
                    }));
                  }}
                  onTableBlockChange={(blockId, content) => {
                    updatePageBlock(page.id, blockId, (block) => ({
                      ...(block as TableDocumentBlock),
                      content,
                    }));
                  }}
                  onTextBlockFocus={(blockId, editor) => {
                    focusPage(page.id);
                    activeBlockIdRef.current = blockId;
                    setActiveEditor(editor);
                    updateSelectionSnapshot(editor);
                  }}
                  onNonTextBlockFocus={(blockId) => {
                    focusPage(page.id);
                    activeBlockIdRef.current = blockId;
                    setActiveEditor(null);
                    clearSelectionSnapshot();
                  }}
                  onSelectionUpdate={updateSelectionSnapshot}
                  onPageElementReady={(pageId, pageElement) => {
                    pageElementsRef.current.set(pageId, pageElement);
                  }}
                  onPageElementDestroy={(pageId) => {
                    pageElementsRef.current.delete(pageId);
                  }}
                />
                <EditorPageControls
                  currentPageNumber={index + 1}
                  totalPageCount={Math.max(documentPages.length, 1)}
                  canEdit={canEdit}
                  onAddPage={() => handleAddPage(index)}
                />
              </div>
            ))}
          </div>
        </main>
        <EditorRightSidebar />
      </div>
    </div>
  );
}

function EditorPaper({
  page,
  canEdit,
  pageLayout,
  pendingFocusBlockId,
  onPendingFocusHandled,
  onInsertBlock,
  onTextBlockChange,
  onImageBlockChange,
  onTableBlockChange,
  onTextBlockFocus,
  onNonTextBlockFocus,
  onSelectionUpdate,
  onPageElementReady,
  onPageElementDestroy,
}: {
  page: DocumentPageContent;
  canEdit: boolean;
  pageLayout: DocumentPaperLayout;
  pendingFocusBlockId: string | null;
  onPendingFocusHandled: (blockId: string) => void;
  onInsertBlock: (
    pageId: string,
    blockType: InsertableBlockType,
    options?: BlockInsertOptions,
  ) => void;
  onTextBlockChange: TextBlockChangeHandler;
  onImageBlockChange: ImageBlockChangeHandler;
  onTableBlockChange: TableBlockChangeHandler;
  onTextBlockFocus: (blockId: string, editor: Editor) => void;
  onNonTextBlockFocus: (blockId: string) => void;
  onSelectionUpdate: (editor: Editor) => void;
  onPageElementReady: (pageId: string, element: HTMLDivElement) => void;
  onPageElementDestroy: (pageId: string) => void;
}) {
  const paperRef = useRef<HTMLDivElement>(null);
  const blockElementsRef = useRef(new Map<string, HTMLDivElement>());
  const insertionControlRef = useRef<HTMLDivElement>(null);
  const [isInsertionMenuOpen, setIsInsertionMenuOpen] = useState(false);
  const [isInsertionControlHovered, setIsInsertionControlHovered] = useState(false);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [hoveredInsertionTarget, setHoveredInsertionTarget] =
    useState<HoverInsertionTarget | null>(null);
  const [activeCursorRatio, setActiveCursorRatio] = useState(0.5);
  const [insertionIndicatorTop, setInsertionIndicatorTop] = useState(96);
  const activeBlockId =
    focusedBlockId && page.blocks.some((block) => block.id === focusedBlockId)
      ? focusedBlockId
      : page.blocks[0]?.id ?? null;
  const resolvedInsertionSide =
    hoveredInsertionTarget?.side ?? getInsertionSideFromRatio(activeCursorRatio, 0.35);
  const resolvedBlockId = hoveredInsertionTarget?.blockId ?? activeBlockId;
  const showInsertionIndicator =
    canEdit &&
    resolvedBlockId !== null &&
    (hoveredInsertionTarget !== null ||
      isInsertionControlHovered ||
      isInsertionMenuOpen);

  useLayoutEffect(() => {
    const paperElement = paperRef.current;

    if (!paperElement) {
      return;
    }

    onPageElementReady(page.id, paperElement);

    return () => {
      onPageElementDestroy(page.id);
    };
  }, [onPageElementDestroy, onPageElementReady, page.id]);

  useLayoutEffect(() => {
    const paperElement = paperRef.current;
    const blockElement = resolvedBlockId
      ? blockElementsRef.current.get(resolvedBlockId)
      : null;

    if (!paperElement || !blockElement) {
      return;
    }

    const updateInsertionAnchor = () => {
      const paperRect = paperElement.getBoundingClientRect();
      const blockRect = blockElement.getBoundingClientRect();
      const rawTop =
        resolvedInsertionSide === "above"
          ? blockRect.top - paperRect.top
          : blockRect.bottom - paperRect.top;

      setInsertionIndicatorTop(clamp(rawTop, 0, paperRect.height));
    };

    updateInsertionAnchor();

    const resizeObserver = new ResizeObserver(() => {
      updateInsertionAnchor();
    });

    resizeObserver.observe(paperElement);
    resizeObserver.observe(blockElement);
    window.addEventListener("resize", updateInsertionAnchor);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateInsertionAnchor);
    };
  }, [page.blocks, resolvedBlockId, resolvedInsertionSide]);

  function handleTextBlockFocus(blockId: string, editor: Editor) {
    setFocusedBlockId(blockId);
    setActiveCursorRatio(getTextCursorRatio(blockId, editor));
    onTextBlockFocus(blockId, editor);
  }

  function handleTextSelectionUpdate(blockId: string, editor: Editor) {
    setFocusedBlockId(blockId);
    setActiveCursorRatio(getTextCursorRatio(blockId, editor));
    onSelectionUpdate(editor);
  }

  function handleNonTextBlockFocus(blockId: string) {
    setFocusedBlockId(blockId);
    setActiveCursorRatio(0.5);
    onNonTextBlockFocus(blockId);
  }

  function handleInsertionTriggerMouseDown(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  function handleBlockPointerMove(
    blockId: string,
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (!canEdit) {
      return;
    }

    const blockRect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientY - blockRect.top) / Math.max(blockRect.height, 1);

    setHoveredInsertionTarget({
      blockId,
      side: getInsertionSideFromRatio(ratio),
    });
  }

  function handleBlockPointerLeave(
    blockId: string,
    event: PointerEvent<HTMLDivElement>,
  ) {
    const nextTarget = event.relatedTarget;

    if (
      nextTarget instanceof Node &&
      insertionControlRef.current?.contains(nextTarget)
    ) {
      return;
    }

    setHoveredInsertionTarget((currentTarget) =>
      currentTarget?.blockId === blockId ? null : currentTarget,
    );
  }

  function handleInsertionControlPointerEnter() {
    setIsInsertionControlHovered(true);
  }

  function handleInsertionControlPointerLeave(
    event: PointerEvent<HTMLDivElement>,
  ) {
    const nextTarget = event.relatedTarget;

    setIsInsertionControlHovered(false);

    if (
      nextTarget instanceof Node &&
      resolvedBlockId &&
      blockElementsRef.current.get(resolvedBlockId)?.contains(nextTarget)
    ) {
      return;
    }

    if (!isInsertionMenuOpen) {
      setHoveredInsertionTarget(null);
    }
  }

  function handleInsertMenuSelect(blockType: InsertableBlockType) {
    onInsertBlock(page.id, blockType, {
      relativeToBlockId: resolvedBlockId ?? page.blocks[0]?.id,
      side: resolvedInsertionSide,
    });
    setIsInsertionMenuOpen(false);
  }

  return (
    <div
      ref={paperRef}
      data-page-id={page.id}
      className="group/document-page relative w-full shrink-0"
      style={getPaperFrameStyle(pageLayout)}
    >
      {canEdit && showInsertionIndicator ? (
        <DropdownMenu open={isInsertionMenuOpen} onOpenChange={setIsInsertionMenuOpen}>
          <div
            ref={insertionControlRef}
            className="absolute inset-x-0 z-20 -translate-y-1/2"
            style={{ top: insertionIndicatorTop }}
            onPointerEnter={handleInsertionControlPointerEnter}
            onPointerLeave={handleInsertionControlPointerLeave}
          >
            <div className="flex items-center gap-3 px-[18mm]">
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Insert content"
                  title="Insert content"
                  onMouseDown={handleInsertionTriggerMouseDown}
                  className="h-8 w-8 shrink-0 rounded-full border-primary/35 bg-card/98 text-primary shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition-colors hover:border-primary/55 hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(26,115,232,0.92),rgba(26,115,232,0.24))]" />
            </div>
          </div>
          <DropdownMenuContent align="start" side="right" className="w-52">
            <DropdownMenuLabel>Insert content</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => handleInsertMenuSelect("text")}>
              <Type className="h-4 w-4" />
              Text
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleInsertMenuSelect("image")}>
              <ImageIcon className="h-4 w-4" />
              Image
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleInsertMenuSelect("table")}>
              <Table2 className="h-4 w-4" />
              Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      <div className="document-page h-full overflow-hidden bg-document text-card-foreground shadow-[0_18px_45px_rgba(15,23,42,0.14),0_2px_6px_rgba(15,23,42,0.08)] ring-1 ring-[rgba(15,23,42,0.08)]">
        <div
          className="box-border h-full"
          style={getPaperContentPaddingStyle(pageLayout)}
        >
          <div
            data-page-flow
            className="document-page-content h-full overflow-hidden"
          >
            <div data-page-blocks className="flex min-h-full flex-col">
              {page.blocks.map((block) => (
                <div
                  key={block.id}
                  data-document-block-id={block.id}
                  ref={(element) => {
                    if (element) {
                      blockElementsRef.current.set(block.id, element);
                      return;
                    }

                    blockElementsRef.current.delete(block.id);
                  }}
                  className="relative"
                  onPointerEnter={(event) => handleBlockPointerMove(block.id, event)}
                  onPointerMove={(event) => handleBlockPointerMove(block.id, event)}
                  onPointerLeave={(event) => handleBlockPointerLeave(block.id, event)}
                >
                  <DocumentBlockRenderer
                    block={block}
                    canEdit={canEdit}
                    shouldAutoFocus={pendingFocusBlockId === block.id}
                    onAutoFocusHandled={onPendingFocusHandled}
                    onTextBlockChange={onTextBlockChange}
                    onImageBlockChange={onImageBlockChange}
                    onTableBlockChange={onTableBlockChange}
                    onTextBlockFocus={handleTextBlockFocus}
                    onNonTextBlockFocus={handleNonTextBlockFocus}
                    onSelectionUpdate={handleTextSelectionUpdate}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function createBlockByType(blockType: InsertableBlockType): DocumentBlock {
  switch (blockType) {
    case "text":
      return createDefaultTextBlock();
    case "image":
      return createDefaultImageBlock();
    case "table":
      return createDefaultTableBlock();
    default:
      return createDefaultTextBlock();
  }
}

function formatBlockTypeLabel(blockType: InsertableBlockType) {
  switch (blockType) {
    case "text":
      return "Text";
    case "image":
      return "Image";
    case "table":
      return "Table";
    default:
      return "Content";
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPaperStackStyle(layout: DocumentPaperLayout): CSSProperties {
  const width = `${layout.widthMm}mm`;

  return {
    width,
    minWidth: width,
    maxWidth: width,
  };
}

function getPaperFrameStyle(layout: DocumentPaperLayout): CSSProperties {
  const height = `${layout.heightMm}mm`;

  return {
    height,
    minHeight: height,
    maxHeight: height,
  };
}

function getPaperContentPaddingStyle(layout: DocumentPaperLayout): CSSProperties {
  return {
    paddingInline: `${layout.paddingXMm}mm`,
    paddingBlock: `${layout.paddingYMm}mm`,
  };
}

function getInsertionSideFromRatio(
  ratio: number,
  threshold = 0.5,
): BlockInsertionSide {
  return ratio <= threshold ? "above" : "below";
}

function getTextCursorRatio(blockId: string, editor: Editor) {
  const blockElement = document.querySelector<HTMLElement>(
    `[data-text-block-id="${blockId}"]`,
  );

  if (!blockElement) {
    return 0.5;
  }

  const blockRect = blockElement.getBoundingClientRect();

  if (blockRect.height <= 0) {
    return 0.5;
  }

  const { top } = editor.view.coordsAtPos(editor.state.selection.from);
  return clamp((top - blockRect.top) / blockRect.height, 0, 1);
}

function repaginateDocumentPages(
  currentPages: DocumentPageContent[],
  pageElements: Map<string, HTMLDivElement>,
) {
  const orderedBlocks = currentPages.flatMap((page) => page.blocks);

  if (orderedBlocks.length === 0) {
    return [createEmptyDocumentPage()];
  }

  const renderedPages = currentPages
    .map((page) => {
      const pageElement = pageElements.get(page.id);

      if (!pageElement) {
        return null;
      }

      const pageFlowElement =
        pageElement.querySelector<HTMLElement>(DOCUMENT_PAGE_FLOW_SELECTOR);
      const pageBlocksElement =
        pageElement.querySelector<HTMLElement>(DOCUMENT_PAGE_BLOCKS_SELECTOR);

      if (!pageFlowElement || !pageBlocksElement) {
        return null;
      }

      const blockGap = Number.parseFloat(getComputedStyle(pageBlocksElement).rowGap);
      const blockHeights = new Map<string, number>();

      page.blocks.forEach((block) => {
        const blockElement = pageElement.querySelector<HTMLElement>(
          `[data-document-block-id="${block.id}"]`,
        );

        if (!blockElement) {
          return;
        }

        blockHeights.set(block.id, blockElement.getBoundingClientRect().height);
      });

      return {
        availableHeight: pageFlowElement.clientHeight,
        blockGap: Number.isFinite(blockGap) ? blockGap : DEFAULT_DOCUMENT_BLOCK_GAP_PX,
        blockHeights,
      };
    })
    .filter((page): page is NonNullable<typeof page> => page !== null);

  if (renderedPages.length !== currentPages.length) {
    return null;
  }

  const availableHeight = renderedPages[0]?.availableHeight ?? 0;
  const blockGap = renderedPages[0]?.blockGap ?? DEFAULT_DOCUMENT_BLOCK_GAP_PX;

  if (availableHeight <= 0) {
    return null;
  }

  const measuredBlocks = currentPages.flatMap((page, pageIndex) =>
    page.blocks.map((block) => ({
      block,
      height: renderedPages[pageIndex]?.blockHeights.get(block.id) ?? 0,
    })),
  );

  if (measuredBlocks.some(({ height }) => height <= 0)) {
    return null;
  }

  const repaginatedBlocks: DocumentBlock[][] = [];
  let currentPageBlocks: DocumentBlock[] = [];
  let currentPageHeight = 0;

  measuredBlocks.forEach(({ block, height }) => {
    const nextPageHeight =
      currentPageBlocks.length === 0
        ? height
        : currentPageHeight + blockGap + height;

    if (currentPageBlocks.length > 0 && nextPageHeight > availableHeight) {
      repaginatedBlocks.push(currentPageBlocks);
      currentPageBlocks = [block];
      currentPageHeight = height;
      return;
    }

    currentPageBlocks = [...currentPageBlocks, block];
    currentPageHeight = nextPageHeight;
  });

  if (currentPageBlocks.length > 0) {
    repaginatedBlocks.push(currentPageBlocks);
  }

  return repaginatedBlocks.map((blocks, index) => ({
    id: currentPages[index]?.id ?? createDocumentPageId(),
    blocks,
  }));
}

function areDocumentPageAssignmentsEqual(
  currentPages: DocumentPageContent[],
  nextPages: DocumentPageContent[],
) {
  if (currentPages.length !== nextPages.length) {
    return false;
  }

  return currentPages.every((page, pageIndex) => {
    const nextPage = nextPages[pageIndex];

    if (!nextPage || page.blocks.length !== nextPage.blocks.length) {
      return false;
    }

    return page.blocks.every((block, blockIndex) => {
      return block.id === nextPage.blocks[blockIndex]?.id;
    });
  });
}

function findDocumentBlockById(
  pages: DocumentPageContent[],
  blockId: string,
): DocumentBlock | null {
  for (const page of pages) {
    const matchingBlock = page.blocks.find((block) => block.id === blockId);

    if (matchingBlock) {
      return matchingBlock;
    }
  }

  return null;
}

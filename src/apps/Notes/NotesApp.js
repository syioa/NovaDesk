import App from "../app.js";
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { editorViewCtx, parserCtx } from "@milkdown/core";

export default class NotesApp extends App {
    static get manifest() {
        return {
            id: "notes",
            name: "Notes",
            icon: "N",
        };
    }

    #window;
    #eventBus;
    #notes = [];
    #trashedNotes = [];
    #selectedNoteId = null;
    #currentView = "notes";
    #storageKey = "novadesk-notes";
    #trashStorageKey = "novadesk-notes-trash";
    #searchQuery = "";
    #editor = null;
    #loadingNote = false;
    #sidebarCollapsed = false;
    #editorNoteId = null;

    #sidebarPreviousWidth = 220;
    #sidebarWidth = 220;
    #sidebarCollapsedWidth = 44;

    #isResizingSidebar = false;
    #sidebarResizeStartX = 0;
    #sidebarResizeStartWidth = 0;

    #sidebarResizeFrame = null;
    #sidebarResizePendingX = null;

    #resizeObserver = null;
    #responsiveSidebarCollapsed = false;
    #responsiveBreakpoint = 700;

    async mount(window, eventBus) {
        super.mount(window);

        this.#window = window;
        this.#eventBus = eventBus;

        this.#eventBus.on(
            "notes:duplicate",
            (noteId) => {
                this.#duplicateNote(
                    this.#window,
                    noteId
                );
            }
        );

        this.#eventBus.on(
            "notes:restore",
            (noteId) => {
                this.#restoreNote(
                    this.#window,
                    noteId
                );
            }
        );

        document.addEventListener('keydown', this.#handleKeyDown);

        window.content.innerHTML = `
<div class="notes">

    <!-- Sidebar -->
    <aside class="notes__sidebar">

        <div class="notes__sidebar-header">
            <h2>Notes</h2>

            <div class="notes__sidebar-actions">
                <button
                    class="notes__new-button"
                    type="button"
                >
                    +
                </button>

                <button
                    class="notes__toggle-button"
                    type="button"
                    aria-label="Collapse notes sidebar"
                >
                    ◀
                </button>
            </div>
        </div>

        <input
            class="notes__search"
            type="search"
            placeholder="Search notes..."
        />

<div class="notes__view-actions">
    <button
        class="notes__view-button notes__view-button--active"
        type="button"
        data-view="notes"
    >
        All Notes
    </button>

    <button
        class="notes__view-button"
        type="button"
        data-view="trash"
    >
        Trash
    </button>
</div>

<div class="notes__trash-actions">
    <button
        class="notes__trash-action-button
               notes__restore-all-button"
        type="button"
    >
        Restore All
    </button>

    <button
        class="notes__trash-action-button
               notes__empty-trash-button"
        type="button"
    >
        Empty Trash
    </button>
</div>

        <div class="notes__list"></div>

        <div class="notes__sidebar-resize-handle"></div>

    </aside>

    <main class="notes__editor">

        <div class="notes__editor-header">
            <input
                class="notes__title"
                type="text"
                placeholder="Note title"
            />

            <button
                class="notes__delete-button"
                type="button"
            >
                Delete
            </button>
        </div>

        <div class="notes__content"></div>

    </main>

</div>
    `;

        this.#bindEvents(window);

        this.#loadNotes();
        this.#setupResponsiveSidebar();

        if (this.#notes.length === 0) {
            this.#createNote(window);
        } else {
            this.#selectedNoteId = this.#notes[0].id;

            this.#renderNotes(window);
            this.#renderEditor(window);
        }

        await this.#createEditor(window);
    }

    #loadNotes() {
        const savedNotes = localStorage.getItem(
            this.#storageKey
        );

        const savedTrashedNotes = localStorage.getItem(
            this.#trashStorageKey
        );

        if (savedNotes) {
            try {
                this.#notes = JSON.parse(savedNotes);
            } catch (error) {
                console.error(
                    "Failed to load Notes data:",
                    error
                );

                this.#notes = [];
            }
        }

        if (savedTrashedNotes) {
            try {
                this.#trashedNotes = JSON.parse(
                    savedTrashedNotes
                );
            } catch (error) {
                console.error(
                    "Failed to load Notes Trash data:",
                    error
                );

                this.#trashedNotes = [];
            }
        }
    }

    #saveNotes() {
        localStorage.setItem(
            this.#storageKey,
            JSON.stringify(this.#notes)
        );
    }

    #saveTrashedNotes() {
        localStorage.setItem(
            this.#trashStorageKey,
            JSON.stringify(this.#trashedNotes)
        );
    }

    #deleteSelectedNote(window) {
        if (!this.#selectedNoteId) {
            return;
        }

        if (this.#currentView === "trash") {
            this.#permanentlyDeleteNote(window);
            return;
        }

        const confirmed = confirm(
            "Are you sure you want to move this note to Trash?"
        );

        if (!confirmed) {
            return;
        }

        const note = this.#notes.find(
            (note) =>
                note.id === this.#selectedNoteId
        );

        if (!note) {
            return;
        }

        this.#notes =
            this.#notes.filter(
                (note) =>
                    note.id !== this.#selectedNoteId
            );

        this.#trashedNotes.unshift({
            ...note,
            deletedAt: Date.now()
        });

        this.#saveNotes();
        this.#saveTrashedNotes();

        if (this.#notes.length === 0) {
            this.#selectedNoteId = null;

            this.#renderNotes(window);
            this.#renderEditor(window);

            return;
        }

        this.#selectedNoteId =
            this.#notes[0].id;

        this.#renderNotes(window);
        this.#renderEditor(window);
    }

    #permanentlyDeleteNote(window) {
        const note =
            this.#trashedNotes.find(
                (note) =>
                    note.id === this.#selectedNoteId
            );

        if (!note) {
            return;
        }

        const confirmed = confirm(
            `Are you sure you want to permanently delete "${note.title}"?`
        );

        if (!confirmed) {
            return;
        }

        this.#trashedNotes =
            this.#trashedNotes.filter(
                (note) =>
                    note.id !== this.#selectedNoteId
            );

        this.#saveTrashedNotes();

        this.#selectedNoteId =
            null;

        this.#renderNotes(window);
        this.#renderEditor(window);
    }

    #loadMarkdown(markdown) {
        if (!this.#editor) {
            return;
        }

        this.#editor.editor.action((ctx) => {
            const parser = ctx.get(parserCtx);
            const view = ctx.get(editorViewCtx);

            const doc = parser(markdown);

            const transaction = view.state.tr.replaceWith(
                0,
                view.state.doc.content.size,
                doc.content
            );

            view.dispatch(transaction);
        });
    }

    #bindEvents(window) {
        const newButton = window.content.querySelector(
            ".notes__new-button"
        );

        const titleInput = window.content.querySelector(
            ".notes__title"
        );

        const contentInput = window.content.querySelector(
            ".notes__content"
        );

        const deleteButton = window.content.querySelector(
            ".notes__delete-button"
        );

        const searchInput = window.content.querySelector(
            ".notes__search"
        );

        const viewButtons = window.content.querySelectorAll(
            ".notes__view-button"
        );

        const restoreAllButton =
            window.content.querySelector(
                ".notes__restore-all-button"
            );

        const emptyTrashButton =
            window.content.querySelector(
                ".notes__empty-trash-button"
            );

        for (const button of viewButtons) {
            button.addEventListener("click", () => {
                this.#switchView(
                    window,
                    button.dataset.view
                );
            });
        }

        restoreAllButton.addEventListener(
            "click",
            () => {
                this.#restoreAllNotes(window);
            }
        );

        emptyTrashButton.addEventListener(
            "click",
            () => {
                this.#emptyTrash(window);
            }
        );

        const toggleButton = window.content.querySelector(
            ".notes__toggle-button"
        );

        const resizeHandle = window.content.querySelector(
            ".notes__sidebar-resize-handle"
        );

        newButton.addEventListener("click", () => {
            this.#createNote(window);
        });

        titleInput.addEventListener("input", () => {
            this.#updateSelectedNote(window);
        });

        contentInput.addEventListener("input", () => {
            this.#updateSelectedNote(window);
        });

        deleteButton.addEventListener("click", () => {
            this.#deleteSelectedNote(window);
        });

        searchInput.addEventListener("input", () => {
            this.#searchQuery = searchInput.value;

            this.#renderNotes(window);
        });

        toggleButton.addEventListener("click", () => {
            this.#toggleSidebar(window);
        });

        resizeHandle.addEventListener(
            "pointerdown",
            (event) => {
                this.#startSidebarResize(
                    window,
                    event
                );
            }
        );
    }

    #handleKeyDown = (event) => {
        if (!this.#window.isFocused) {
            return;
        }

        if (
            event.ctrlKey &&
            event.altKey &&
            event.key.toLowerCase() === 'n'
        ) {
            event.preventDefault();

            this.#createNote(this.#window);
            return;
        }

        if (
            event.ctrlKey &&
            event.altKey &&
            event.key.toLowerCase() === 's'
        ) {
            event.preventDefault();

            const searchInput = this.#window.content.querySelector(
                '.notes__search'
            );

            searchInput?.focus();
            return;
        }

        if (
            event.ctrlKey &&
            event.altKey &&
            event.key === "ArrowUp"
        ) {
            event.preventDefault();

            this.#navigateNote(this.#window, -1);
            return;
        }

        if (
            event.ctrlKey &&
            event.altKey &&
            event.key === "ArrowDown"
        ) {
            event.preventDefault();

            this.#navigateNote(this.#window, 1);
            return;
        }
    };

    #startSidebarResize(window, event) {
        this.#isResizingSidebar = true;

        const notes =
            window.content.querySelector(
                ".notes"
            );

        notes.classList.add(
            "notes--sidebar-resizing"
        );

        this.#sidebarResizeStartX = event.clientX;

        this.#sidebarResizeStartWidth =
            this.#sidebarCollapsed
                ? this.#sidebarCollapsedWidth
                : this.#sidebarWidth;

        const resizeHandle =
            event.currentTarget;

        resizeHandle.setPointerCapture(
            event.pointerId
        );

        resizeHandle.addEventListener(
            "pointermove",
            this.#handleSidebarResize
        );

        resizeHandle.addEventListener(
            "pointerup",
            this.#stopSidebarResize
        );

        resizeHandle.addEventListener(
            "pointercancel",
            this.#stopSidebarResize
        );

        document.body.style.cursor =
            "ew-resize";

        document.body.style.userSelect =
            "none";
    }

    #handleSidebarResize = (event) => {
        if (!this.#isResizingSidebar) {
            return;
        }

        this.#sidebarResizePendingX =
            event.clientX;

        if (this.#sidebarResizeFrame !== null) {
            return;
        }

        this.#sidebarResizeFrame =
            requestAnimationFrame(() => {
                this.#sidebarResizeFrame = null;

                if (
                    !this.#isResizingSidebar ||
                    this.#sidebarResizePendingX === null
                ) {
                    return;
                }

                const deltaX =
                    this.#sidebarResizePendingX -
                    this.#sidebarResizeStartX;

                const newWidth =
                    this.#sidebarResizeStartWidth +
                    deltaX;

                // Dragging left to the collapsed threshold.
                if (
                    newWidth <=
                    this.#sidebarCollapsedWidth
                ) {
                    this.#responsiveSidebarCollapsed = false;

                    this.#sidebarPreviousWidth =
                        this.#sidebarWidth;

                    this.#setSidebarCollapsed(
                        this.#window,
                        true
                    );

                    return;
                }

                // If dragging right from the collapsed state,
                // smoothly expand from 44px.
                if (this.#sidebarCollapsed) {
                    this.#responsiveSidebarCollapsed = false;
                    this.#sidebarCollapsed = false;
                }

                this.#sidebarWidth =
                    Math.min(
                        400,
                        Math.max(
                            this.#sidebarCollapsedWidth,
                            newWidth
                        )
                    );

                this.#sidebarPreviousWidth =
                    this.#sidebarWidth;

                const sidebar =
                    this.#window.content.querySelector(
                        ".notes__sidebar"
                    );

                const notes =
                    this.#window.content.querySelector(
                        ".notes"
                    );

                notes.classList.remove(
                    "notes--sidebar-collapsed"
                );

                sidebar.style.flexBasis =
                    `${this.#sidebarWidth}px`;

                sidebar.style.width =
                    `${this.#sidebarWidth}px`;
            });
    };


    #stopSidebarResize = (event) => {
        if (!this.#isResizingSidebar) {
            return;
        }

        this.#isResizingSidebar = false;

        if (this.#sidebarResizeFrame !== null) {
            cancelAnimationFrame(
                this.#sidebarResizeFrame
            );

            this.#sidebarResizeFrame = null;
        }

        this.#sidebarResizePendingX = null;

        const resizeHandle =
            event.currentTarget;

        resizeHandle.releasePointerCapture?.(
            event.pointerId
        );

        resizeHandle.removeEventListener(
            "pointermove",
            this.#handleSidebarResize
        );

        resizeHandle.removeEventListener(
            "pointerup",
            this.#stopSidebarResize
        );

        resizeHandle.removeEventListener(
            "pointercancel",
            this.#stopSidebarResize
        );

        document.body.style.cursor = "";

        document.body.style.userSelect = "";

        const notes =
            this.#window.content.querySelector(
                ".notes"
            );

        notes.classList.remove(
            "notes--sidebar-resizing"
        );
    };

    #setupResponsiveSidebar() {
        const notes = this.#window?.content.querySelector(
            ".notes"
        );

        if (!notes) {
            return;
        }

        this.#resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];

            if (!entry) {
                return;
            }

            const width = entry.contentRect.width;

            if (
                width < this.#responsiveBreakpoint &&
                !this.#responsiveSidebarCollapsed
            ) {
                this.#responsiveSidebarCollapsed = true;

                this.#setSidebarCollapsed(
                    this.#window,
                    true
                );

                return;
            }

            if (
                width >= this.#responsiveBreakpoint &&
                this.#responsiveSidebarCollapsed
            ) {
                this.#responsiveSidebarCollapsed = false;

                this.#setSidebarCollapsed(
                    this.#window,
                    false
                );
            }
        });

        this.#resizeObserver.observe(notes);
    }

    #createNote(window) {
        const note = {
            id: crypto.randomUUID(),
            title: "Untitled Note",
            content: "",
            updatedAt: Date.now()
        };

        this.#notes.unshift(note);

        this.#selectedNoteId = note.id;

        this.#saveNotes();

        this.#renderNotes(window);
        this.#renderEditor(window);
    }

    #renderNotes(window) {
        const list = window.content.querySelector(
            ".notes__list"
        );

        list.innerHTML = "";

        const visibleNotes =
            this.#getVisibleNotes();

        if (visibleNotes.length === 0) {
            const emptyMessage =
                document.createElement("div");

            emptyMessage.className =
                "notes__empty";

            emptyMessage.textContent =
                this.#currentView === "trash"
                    ? "Trash is empty"
                    : this.#searchQuery.trim()
                        ? "No notes found"
                        : "No notes";

            list.append(emptyMessage);

            return;
        }

        for (const note of visibleNotes) {
            const item = document.createElement("div");

            item.className =
                "notes__item";

            item.tabIndex = 0;

            item.dataset.noteId =
                note.id;

            item.textContent =
                note.title;

            item.title =
                note.title;

            if (
                note.id ===
                this.#selectedNoteId
            ) {
                item.classList.add(
                    "notes__item--selected"
                );
            }

            item.addEventListener(
                "click",
                () => {
                    this.#selectNote(
                        window,
                        note.id
                    );
                }
            );

            item.addEventListener(
                "dblclick",
                (event) => {
                    event.preventDefault();

                    this.#startRenameNote(
                        window,
                        note.id,
                        item
                    );
                }
            );

            item.addEventListener(
                "contextmenu",
                (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    this.#eventBus.emit(
                        "notes:contextmenu",
                        {
                            event,
                            noteId: note.id,
                            view: this.#currentView
                        }
                    );
                }
            );

            list.append(item);
        }
    }

    #duplicateNote(window, noteId) {
        const note = this.#notes.find(
            (note) => note.id === noteId
        );

        if (!note) {
            return;
        }

        let number = 1;

        let duplicatedTitle =
            `${note.title} ${number}`;
        while (

            this.#notes.some(
                (existingNote) =>
                    existingNote.title === duplicatedTitle
            )
        ) {
            number++;

            duplicatedTitle =
                `${note.title} ${number}`;
        }

        const duplicatedNote = {
            id: crypto.randomUUID(),
            title: duplicatedTitle,
            content: note.content,
            updatedAt: Date.now()
        };

        this.#notes.unshift(
            duplicatedNote
        );

        this.#selectedNoteId =
            duplicatedNote.id;

        this.#saveNotes();

        this.#renderNotes(window);
        this.#renderEditor(window);
    }

    #restoreNote(window, noteId) {
        if (this.#currentView !== "trash") {
            return;
        }

        const noteIndex = this.#trashedNotes.findIndex(
            (note) => note.id === noteId
        );

        if (noteIndex === -1) {
            return;
        }

        const [note] = this.#trashedNotes.splice(
            noteIndex,
            1
        );

        const restoredNote = {
            ...note
        };

        delete restoredNote.deletedAt;

        this.#notes.unshift(restoredNote);

        this.#saveNotes();
        this.#saveTrashedNotes();

        this.#selectedNoteId = restoredNote.id;

        this.#currentView = "notes";

        this.#searchQuery = "";

        const searchInput =
            window.content.querySelector(
                ".notes__search"
            );

        if (searchInput) {
            searchInput.value = "";
        }

        const viewButtons =
            window.content.querySelectorAll(
                ".notes__view-button"
            );

        for (const button of viewButtons) {
            button.classList.toggle(
                "notes__view-button--active",
                button.dataset.view === "notes"
            );
        }

        this.#renderNotes(window);
        this.#renderEditor(window);
    }

    #restoreAllNotes(window) {
        if (this.#trashedNotes.length === 0) {
            return;
        }

        const confirmed = confirm(
            "Are you sure you want to restore all notes from Trash?"
        );

        if (!confirmed) {
            return;
        }

        const restoredNotes =
            this.#trashedNotes.map(
                (note) => {
                    const restoredNote = {
                        ...note
                    };

                    delete restoredNote.deletedAt;

                    return restoredNote;
                }
            );

        this.#notes.unshift(
            ...restoredNotes
        );

        this.#trashedNotes = [];

        this.#saveNotes();
        this.#saveTrashedNotes();

        this.#selectedNoteId =
            restoredNotes[0]?.id ?? null;

        this.#currentView = "notes";

        this.#searchQuery = "";

        const searchInput =
            window.content.querySelector(
                ".notes__search"
            );

        if (searchInput) {
            searchInput.value = "";
        }

        const viewButtons =
            window.content.querySelectorAll(
                ".notes__view-button"
            );

        for (const button of viewButtons) {
            button.classList.toggle(
                "notes__view-button--active",
                button.dataset.view === "notes"
            );
        }

        this.#renderNotes(window);
        this.#renderEditor(window);
    }

    #emptyTrash(window) {
        if (this.#trashedNotes.length === 0) {
            return;
        }

        const confirmed = confirm(
            "Are you sure you want to permanently delete all notes in Trash?"
        );

        if (!confirmed) {
            return;
        }

        this.#trashedNotes = [];

        this.#saveTrashedNotes();

        this.#selectedNoteId = null;

        this.#renderNotes(window);
        this.#renderEditor(window);
    }

    #startRenameNote(window, noteId, item) {
        const note = this.#notes.find(
            (note) => note.id === noteId
        );

        if (!note) {
            return;
        }

        const input = document.createElement("input");

        input.type = "text";
        input.className = "notes__item-title-input";
        input.value = note.title;

        item.textContent = "";
        item.append(input);

        input.focus();
        input.select();

        let finished = false;

        const finishRename = (save) => {
            if (finished) {
                return;
            }

            finished = true;

            if (save) {
                const newTitle = input.value.trim();

                note.title = newTitle || "Untitled Note";
                note.updatedAt = Date.now();

                this.#saveNotes();

                const titleInput = window.content.querySelector(
                    ".notes__title"
                );

                if (note.id === this.#selectedNoteId) {
                    titleInput.value = note.title;
                }
            }

            this.#renderNotes(window);
        };

        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                finishRename(true);
                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();
                finishRename(false);
                return;
            }
        });

        input.addEventListener("blur", () => {
            finishRename(true);
        });
    }

    #updateSelectedNote(window) {
        const note = this.#notes.find(
            (note) => note.id === this.#selectedNoteId
        );

        if (!note) {
            return;
        }

        const titleInput = window.content.querySelector(
            ".notes__title"
        );

        note.title = titleInput.value || "Untitled Note";
        note.updatedAt = Date.now();

        this.#saveNotes();

        this.#renderNotes(window);
    }

    #getVisibleNotes() {
        const notes =
            this.#currentView === "trash"
                ? this.#trashedNotes
                : this.#notes;

        const query = this.#searchQuery
            .trim()
            .toLowerCase();

        return [...notes]
            .sort(
                (a, b) => {
                    if (this.#currentView === "trash") {
                        return (
                            (b.deletedAt ?? 0) -
                            (a.deletedAt ?? 0)
                        );
                    }

                    return (
                        (b.updatedAt ?? 0) -
                        (a.updatedAt ?? 0)
                    );
                }
            )
            .filter((note) => {
                if (!query) {
                    return true;
                }

                const title = note.title.toLowerCase();
                const content = note.content.toLowerCase();

                return (
                    title.includes(query) ||
                    content.includes(query)
                );
            });
    }

    #navigateNote(window, direction) {
        const visibleNotes = this.#getVisibleNotes();

        if (this.#currentView === "trash") {
            return;
        }

        if (visibleNotes.length === 0) {
            return;
        }

        const currentIndex = visibleNotes.findIndex(
            (note) => note.id === this.#selectedNoteId
        );

        if (currentIndex === -1) {
            this.#selectNote(
                window,
                visibleNotes[0].id
            );

            return;
        }

        const newIndex =
            (currentIndex + direction + visibleNotes.length) %
            visibleNotes.length;

        this.#selectNote(
            window,
            visibleNotes[newIndex].id
        );
    }

    #toggleSidebar(window) {
        this.#responsiveSidebarCollapsed = false;

        this.#setSidebarCollapsed(
            window,
            !this.#sidebarCollapsed
        );
    }

    #setSidebarCollapsed(window, collapsed) {
        const sidebar =
            window.content.querySelector(
                ".notes__sidebar"
            );

        const notes =
            window.content.querySelector(
                ".notes"
            );

        const toggleButton =
            window.content.querySelector(
                ".notes__toggle-button"
            );

        if (!sidebar || !notes || !toggleButton) {
            return;
        }

        if (collapsed) {
            // Only save the current width when entering
            // the collapsed state for the first time.
            if (!this.#sidebarCollapsed) {
                this.#sidebarPreviousWidth =
                    this.#sidebarWidth;
            }

            this.#sidebarCollapsed = true;

            notes.classList.add(
                "notes--sidebar-collapsed"
            );

            sidebar.style.flexBasis =
                `${this.#sidebarCollapsedWidth}px`;

            sidebar.style.width =
                `${this.#sidebarCollapsedWidth}px`;

            toggleButton.textContent = "▶";

            toggleButton.setAttribute(
                "aria-label",
                "Expand notes sidebar"
            );

            return;
        }

        // Restore the previously saved expanded width.
        this.#sidebarCollapsed = false;

        this.#sidebarWidth =
            Math.min(
                400,
                Math.max(
                    180,
                    this.#sidebarPreviousWidth
                )
            );

        notes.classList.remove(
            "notes--sidebar-collapsed"
        );

        sidebar.style.flexBasis =
            `${this.#sidebarWidth}px`;

        sidebar.style.width =
            `${this.#sidebarWidth}px`;

        toggleButton.textContent = "◀";

        toggleButton.setAttribute(
            "aria-label",
            "Collapse notes sidebar"
        );
    }

    #getEditorContent() {
        if (!this.#editor) {
            return "";
        }

        return this.#editor.editor.action(
            (ctx) => {
                const view = ctx.get(editorViewCtx);

                return view.state.doc.textContent;
            }
        );
    }

    destroy() {
        this.#resizeObserver?.disconnect();
        this.#resizeObserver = null;
    }

    #switchView(window, view) {
        if (
            view !== "notes" &&
            view !== "trash"
        ) {
            return;
        }

        this.#currentView = view;

        const deleteButton =
            window.content.querySelector(
                ".notes__delete-button"
            );

        if (deleteButton) {
            deleteButton.textContent =
                view === "trash"
                    ? "Delete Permanently"
                    : "Move to Trash";
        }

        const trashActions =
            window.content.querySelector(
                ".notes__trash-actions"
            );

        if (trashActions) {
            trashActions.classList.toggle(
                "notes__trash-actions--visible",
                view === "trash"
            );
        }

        const viewButtons =
            window.content.querySelectorAll(
                ".notes__view-button"
            );

        for (const button of viewButtons) {
            button.classList.toggle(
                "notes__view-button--active",
                button.dataset.view === view
            );
        }

        this.#renderNotes(window);
    }

    #updateSelectedNoteFromEditor(markdown) {
        const note = this.#notes.find(
            (note) => note.id === this.#selectedNoteId
        );

        if (!note) {
            return;
        }

        if (note.content === markdown) {
            return;
        }

        note.content = markdown;
        note.updatedAt = Date.now();

        this.#saveNotes();
    }

    async #selectNote(window, noteId) {
        this.#selectedNoteId = noteId;

        const list = window.content.querySelector(
            ".notes__list"
        );

        const items = list.querySelectorAll(
            ".notes__item"
        );

        for (const item of items) {
            item.classList.remove(
                "notes__item--selected"
            );
        }

        const selectedItem = [...items].find(
            (item) =>
                item.dataset.noteId === noteId
        );

        if (selectedItem) {
            selectedItem.classList.add(
                "notes__item--selected"
            );
        }

        this.#scrollSelectedNoteIntoView(window);

        if (this.#currentView === "trash") {
            return;
        }

        await this.#renderEditor(window);
    }

    #scrollSelectedNoteIntoView(window) {
        const list = window.content.querySelector(
            ".notes__list"
        );

        const selectedItem = list.querySelector(
            ".notes__item--selected"
        );

        if (!selectedItem) {
            return;
        }

        selectedItem.scrollIntoView({
            behavior: "auto",
            block: "nearest"
        });
    }

    #renderEditor(window) {
        const titleInput = window.content.querySelector(
            ".notes__title"
        );

        const note = this.#notes.find(
            (note) => note.id === this.#selectedNoteId
        );

        if (!note) {
            titleInput.value = "";
            return;
        }

        titleInput.value = note.title;

        if (this.#editor) {
            this.#editorNoteId = note.id;

            this.#loadMarkdown(note.content);
        }
    }

    async #createEditor(window) {
        const editorElement = window.content.querySelector(
            ".notes__content"
        );

        this.#editor = new Crepe({
            root: editorElement,
            defaultValue: "",

            featureConfigs: {
                [Crepe.Feature.BlockEdit]: {
                    enable: true
                },

                [Crepe.Feature.ImageBlock]: {
                    onUpload: async (file) => {
                        return await this.#uploadImage(file);
                    }
                }
            }
        });

        this.#editor.editor
            .use(listener)
            .config((ctx) => {
                ctx.get(listenerCtx).markdownUpdated(
                    (ctx, markdown) => {
                        if (
                            this.#editorNoteId !==
                            this.#selectedNoteId
                        ) {
                            return;
                        }

                        this.#updateSelectedNoteFromEditor(
                            markdown
                        );
                    }
                );
            });

        await this.#editor.create();
    }

    async #uploadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                resolve(reader.result);
            };

            reader.onerror = () => {
                reject(
                    new Error("Failed to read image")
                );
            };

            reader.readAsDataURL(file);
        });
    }

}
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

    #notes = [];
    #selectedNoteId = null;
    #storageKey = "novadesk-notes";
    #searchQuery = "";
    #editor = null;
    #loadingNote = false;
    #sidebarCollapsed = false;

    async mount(window) {
        super.mount(window);

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

        <div class="notes__list"></div>

    </aside>

    <!-- Main editor -->
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

        if (!savedNotes) {
            return;
        }

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

    #saveNotes() {
        localStorage.setItem(
            this.#storageKey,
            JSON.stringify(this.#notes)
        );
    }

    #deleteSelectedNote(window) {
        if (!this.#selectedNoteId) {
            return;
        }

        const confirmed = confirm(
            "Are you sure you want to delete this note?"
        );

        if (!confirmed) {
            return;
        }

        this.#notes = this.#notes.filter(
            (note) => note.id !== this.#selectedNoteId
        );

        this.#saveNotes();

        if (this.#notes.length === 0) {
            this.#selectedNoteId = null;

            this.#renderNotes(window);
            this.#renderEditor(window);

            return;
        }

        this.#selectedNoteId = this.#notes[0].id;

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

        const toggleButton = window.content.querySelector(
            ".notes__toggle-button"
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

        const query = this.#searchQuery
            .trim()
            .toLowerCase();

        const sortedNotes = [...this.#notes]
            .sort(
                (a, b) =>
                    (b.updatedAt ?? 0) -
                    (a.updatedAt ?? 0)
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

        if (sortedNotes.length === 0) {
            const emptyMessage = document.createElement("div");

            emptyMessage.className = "notes__empty";
            emptyMessage.textContent = query
                ? "No notes found"
                : "No notes";

            list.append(emptyMessage);

            return;
        }

        for (const note of sortedNotes) {
            const item = document.createElement("button");

            item.type = "button";
            item.className = "notes__item";

            item.textContent = note.title;
            item.title = note.title;

            if (note.id === this.#selectedNoteId) {
                item.classList.add(
                    "notes__item--selected"
                );
            }

            item.addEventListener("click", () => {
                this.#selectedNoteId = note.id;

                this.#renderNotes(window);
                this.#renderEditor(window);
            });

            list.append(item);
        }
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
            this.#loadingNote = true;

            this.#loadingNote = true;

            this.#loadMarkdown(note.content);

            this.#loadingNote = false;

            this.#loadingNote = false;
        }
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

    #toggleSidebar(window) {
        this.#sidebarCollapsed =
            !this.#sidebarCollapsed;

        const notes = window.content.querySelector(
            ".notes"
        );

        notes.classList.toggle(
            "notes--sidebar-collapsed",
            this.#sidebarCollapsed
        );

        const toggleButton = window.content.querySelector(
            ".notes__toggle-button"
        );

        toggleButton.textContent =
            this.#sidebarCollapsed
                ? "▶"
                : "◀";

        toggleButton.setAttribute(
            "aria-label",
            this.#sidebarCollapsed
                ? "Expand notes sidebar"
                : "Collapse notes sidebar"
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

    #updateSelectedNoteFromEditor(markdown) {
        if (this.#loadingNote) {
            return;
        }

        const note = this.#notes.find(
            (note) => note.id === this.#selectedNoteId
        );

        if (!note) {
            return;
        }

        note.content = markdown;
        note.updatedAt = Date.now();

        this.#saveNotes();
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
                        this.#updateSelectedNoteFromEditor(
                            markdown
                        );
                    }
                );
            });

        console.log("Crepe:", Crepe);
        console.table(Crepe.Feature);
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
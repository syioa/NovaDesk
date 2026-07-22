import App from "../app.js";

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

    mount(window) {
        super.mount(window);

        window.content.innerHTML = `
            <div class="notes">
                <aside class="notes__sidebar">
                    <div class="notes__sidebar-header">
                        <h2>Notes</h2>

                        <button
                            class="notes__new-button"
                            type="button"
                        >
                            +
                        </button>
                    </div>

                    <div class="notes__list"></div>
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

    <textarea
        class="notes__content"
        placeholder="Start writing..."
    ></textarea>
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
    }

    #createNote(window) {
        const note = {
            id: crypto.randomUUID(),
            title: "Untitled Note",
            content: ""
        };

        this.#notes.push(note);

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

        for (const note of this.#notes) {
            const item = document.createElement("button");

            item.type = "button";
            item.className = "notes__item";
            item.textContent = note.title;

            if (note.id === this.#selectedNoteId) {
                item.classList.add("notes__item--selected");
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

        const contentInput = window.content.querySelector(
            ".notes__content"
        );

        const note = this.#notes.find(
            (note) => note.id === this.#selectedNoteId
        );

        if (!note) {
            titleInput.value = "";
            contentInput.value = "";

            return;
        }

        titleInput.value = note.title;
        contentInput.value = note.content;
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

        const contentInput = window.content.querySelector(
            ".notes__content"
        );

        note.title = titleInput.value || "Untitled Note";
        note.content = contentInput.value;

        this.#saveNotes(window);

        this.#renderNotes(window);
    }
}
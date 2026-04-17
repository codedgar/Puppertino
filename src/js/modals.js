class PuppertinoModalMan {
  constructor() {
    this.modalBackground = document.querySelector(".p-modal-background");
    this.lastFocusedElement = null;
    this.init();
  }

  init() {
    document.addEventListener("click", (event) => this.handleDocumentClick(event));
    document.addEventListener("keydown", (event) => this.handleKeydown(event));
  }

  handleDocumentClick(event) {
    const openTrigger = event.target.closest("[data-p-open-modal]");
    if (openTrigger) {
      event.preventDefault();
      const selector = openTrigger.getAttribute("data-p-open-modal");
      this.openModal(selector);
      return;
    }

    const closeTrigger = event.target.closest("[data-p-cancel], [data-p-close-modal]");
    if (closeTrigger) {
      event.preventDefault();
      const selector = closeTrigger.getAttribute("data-p-close-modal");

      if (selector) {
        this.closeModal(selector);
        return;
      }

      this.closeActiveModal();
      return;
    }

    if (this.modalBackground && event.target === this.modalBackground) {
      const activeModal = this.getActiveModal();
      if (
        activeModal &&
        activeModal.getAttribute("data-p-close-on-outside") === "true"
      ) {
        event.preventDefault();
        this.closeActiveModal();
      }
    }
  }

  handleKeydown(event) {
    const activeModal = this.getActiveModal();
    if (!activeModal) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.closeActiveModal();
      return;
    }

    if (event.key === "Tab") {
      this.trapFocus(event, activeModal);
    }
  }

  getActiveModal() {
    return document.querySelector(".p-modal.active");
  }

  openModal(selector) {
    if (!selector || selector.trim().length === 0) {
      console.warn(
        "Error: The data-p-open-modal attribute is empty. Please specify the ID or selector of the modal you want to open."
      );
      return;
    }

    const modal = document.querySelector(selector);

    if (!modal) {
      console.warn(
        `Error: No modal found matching selector "${selector}". Ensure the selector is correct.`
      );
      return;
    }

    if (!this.modalBackground) {
      console.warn(
        "Error: No .p-modal-background container found. Add one to the page before opening modals."
      );
      return;
    }

    const activeModal = this.getActiveModal();
    if (activeModal && activeModal !== modal) {
      this.closeModalElement(activeModal, false);
    }

    this.lastFocusedElement = document.activeElement;
    this.modalBackground.classList.add("nowactive");
    document.body.classList.add("p-modal-opened");
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    this.focusFirstInteractiveElement(modal);
  }

  closeActiveModal() {
    const activeModal = this.getActiveModal();
    if (!activeModal) {
      return;
    }

    this.closeModalElement(activeModal, true);
  }

  closeModal(selector) {
    const modal = document.querySelector(selector);
    if (!modal || !modal.classList.contains("active")) {
      return;
    }

    this.closeModalElement(modal, true);
  }

  closeModalElement(modal, restoreFocus) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");

    if (!this.getActiveModal()) {
      this.modalBackground?.classList.remove("nowactive");
      document.body.classList.remove("p-modal-opened");
    }

    if (restoreFocus && this.lastFocusedElement instanceof HTMLElement) {
      this.lastFocusedElement.focus();
      this.lastFocusedElement = null;
    }
  }

  focusFirstInteractiveElement(modal) {
    const focusTarget = this.getFocusableElements(modal)[0];

    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus();
      return;
    }

    if (modal instanceof HTMLElement) {
      if (!modal.hasAttribute("tabindex")) {
        modal.setAttribute("tabindex", "-1");
      }
      modal.focus();
    }
  }

  getFocusableElements(modal) {
    return Array.from(
      modal.querySelectorAll(
        "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
      )
    ).filter((element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      return !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true";
    });
  }

  trapFocus(event, modal) {
    const focusableElements = this.getFocusableElements(modal);

    if (focusableElements.length === 0) {
      event.preventDefault();
      if (modal instanceof HTMLElement) {
        if (!modal.hasAttribute("tabindex")) {
          modal.setAttribute("tabindex", "-1");
        }
        modal.focus();
      }
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  isModalOpen(selector) {
    const modal = document.querySelector(selector);
    return modal ? modal.classList.contains("active") : false;
  }
}

const PuppertinoModalManager = new PuppertinoModalMan();

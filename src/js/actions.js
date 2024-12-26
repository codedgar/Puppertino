class PuppertinoActionsMan {
    constructor() {
      this.init();
    }
  
    init() {
      this.attachOpenActionListeners();
      this.attachCloseActionListeners();
      this.attachOutsideClickListener();
      this.preventActionClickPropagation();
    }
  
    attachOpenActionListeners() {
      const openActionButtons = document.querySelectorAll("[data-p-open-actions]");
      openActionButtons.forEach(button => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          const selector = button.getAttribute("data-p-open-actions");
  
          if (!selector || selector.trim().length === 0) {
            console.warn(
              "Error: The data-p-open-actions attribute is empty. Please specify the ID or selector of the action card you want to open."
            );
            return;
          }
  
          this.openAction(selector);
        });
      });
    }
  
    attachCloseActionListeners() {
      const closeActionButtons = document.querySelectorAll("[data-p-cancel-action]");
      closeActionButtons.forEach(button => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          this.closeActiveAction();
        });
      });
    }
  
    attachOutsideClickListener() {
      const actionBackground = document.querySelector(".p-action-background");
      if (actionBackground) {
        actionBackground.addEventListener("click", (event) => {
          event.preventDefault();
          const activeAction = document.querySelector(".p-action-big-container.active");
  
          if (
            activeAction &&
            activeAction.getAttribute("data-p-close-on-outside") === "true"
          ) {
            this.closeActiveAction();
          }
        });
      }
    }
  
    preventActionClickPropagation() {
      const actions = document.querySelectorAll(".p-action-big-container");
      actions.forEach(action => {
        action.addEventListener("click", (event) => {
          event.stopPropagation();
        });
      });
    }
  
    openAction(selector) {
      const action = document.querySelector(selector);
  
      if (!action) {
        console.warn(
          `Error: No action card found matching selector "${selector}". Ensure the selector is correct.`
        );
        return;
      }
  
      document.querySelector(".p-action-background").classList.add("nowactive");
      document.body.classList.add("p-modal-opened");
      action.classList.add("active");
      action.setAttribute("aria-hidden", "false");
    }
  
    closeActiveAction() {
      const activeAction = document.querySelector(".p-action-big-container.active");
      if (activeAction) {
        activeAction.classList.remove("active");
        activeAction.setAttribute("aria-hidden", "true");
      }
  
      const actionBackground = document.querySelector(".p-action-background");
      if (actionBackground) {
        actionBackground.classList.remove("nowactive");
      }
  
      document.body.classList.remove("p-modal-opened");
    }
  
    closeAction(selector) {
      const action = document.querySelector(selector);
      if (action && action.classList.contains("active")) {
        action.classList.remove("active");
        action.setAttribute("aria-hidden", "true");
        const actionBackground = document.querySelector(".p-action-background");
        if (actionBackground) {
          actionBackground.classList.remove("nowactive");
        }
        document.body.classList.remove("p-modal-opened");
      }
    }
  
    isActionOpen(selector) {
      const action = document.querySelector(selector);
      return action ? action.classList.contains("active") : false;
    }
  }
  
  // Initialize the PuppertinoActionsMan instance
  const PuppertinoActionsManager = new PuppertinoActionsMan();
  

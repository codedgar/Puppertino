class PuppertinoTabsMan {
  constructor() {
    this.init();
  }

  init() {
    this.attachDesktopTabListeners();
    this.attachMobileTabListeners();
  }

  attachDesktopTabListeners() {
    document.addEventListener("click", (event) => {
      const tabsContainer = event.target.closest(".p-tabs-container");
      if (!tabsContainer) return;

      const tabs = Array.from(tabsContainer.querySelector(".p-tabs").children);
      const panels = Array.from(tabsContainer.querySelector(".p-panels").children);
      const clickedIndex = tabs.indexOf(event.target);

      if (clickedIndex !== -1) {
        this.activateTabByIndex(`#${tabsContainer.id}`, clickedIndex);
      }
    });
  }

  attachMobileTabListeners() {
    const mobileTabs = document.querySelectorAll(".p-mobile-tabs a, .p-mobile-tabs button");

    mobileTabs.forEach(tab => {
      tab.addEventListener("click", (event) => {
        event.preventDefault();

        const parentContainer = tab.closest(".p-mobile-tabs");
        const contentContainer = document.querySelector(
          `.p-mobile-tabs--content.active`
        );
        const targetPanel = document.querySelector(tab.getAttribute("data-p-mobile-toggle"));

        if (parentContainer) {
          const activeTab = parentContainer.querySelector(".active");
          if (activeTab) activeTab.classList.remove("active");
          tab.classList.add("active");
        }

        if (contentContainer) {
          contentContainer.classList.remove("active");
        }

        if (targetPanel) {
          targetPanel.classList.add("active");
        }
      });
    });
  }

  activateTabByIndex(containerSelector, index) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.warn(`Container not found: ${containerSelector}`);
      return;
    }

    const tabs = Array.from(container.querySelector(".p-tabs").children);
    const panels = Array.from(container.querySelector(".p-panels").children);

    if (index < 0 || index >= tabs.length || index >= panels.length) {
      console.warn(`Invalid index: ${index}`);
      return;
    }

    tabs.forEach(tab => tab.classList.remove("p-is-active"));
    panels.forEach(panel => panel.classList.remove("p-is-active"));

    tabs[index].classList.add("p-is-active");
    panels[index].classList.add("p-is-active");
  }
}

// Initialize the PuppertinoTabsMan instance
const tabsManager = new PuppertinoTabsMan();

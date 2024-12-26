class PuppertinoSegmentedCon {
  constructor() {
    this.init();
  }

  init() {
    this.attachSegmentedControlListeners();
  }

  attachSegmentedControlListeners() {
    const segmentedControls = document.querySelectorAll(".p-segmented-controls a, .p-segmented-controls button");
    segmentedControls.forEach(control => {
      control.addEventListener("click", (event) => {
        event.preventDefault();
        this.activateControl(control);
      });
    });
  }

  activateControl(control) {
    const parent = control.parentElement;
    const activeElement = parent.querySelector(".active");

    if (activeElement) {
      activeElement.classList.remove("active");
    }

    control.classList.add("active");
  }
}

// Initialize the PuppertinoSegmentedCon instance
const segmentedControlManager = new PuppertinoSegmentedCon();

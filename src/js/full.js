    (function (document) {

        var p_actions = document.querySelectorAll("[data-p-open-actions]");
        var actions = document.querySelectorAll(".p-action-big-container");
        var cancel_action = document.querySelectorAll("[data-p-cancel-action]");

        for (var item of p_actions) {
            item.addEventListener("click", function (event) {
                event.preventDefault();
                var selector = this.getAttribute("data-p-open-actions");
                if (selector.length == 0) {
                    console.warn(
                        "Error. The data-p-open-action attribute is empty, please add the ID of the action you want to open."
                    );
                    return false;
                }
                document.querySelector(".p-action-background").classList.add("nowactive");
                document.body.classList.add("p-modal-opened");
                document.querySelector(selector).classList.add("active");
            });
        }

        for (var element of cancel_action) {
            element.addEventListener("click", function (event) {
                event.preventDefault();
                document.querySelector(".p-action-big-container.active").classList.remove("active");
                document.querySelector(".p-action-background").classList.remove("nowactive");
                document.body.classList.remove("p-modal-opened");
            });
        }

        document
            .querySelector(".p-action-background")
            .addEventListener("click", function (event) {
                event.preventDefault();
                var opened_action = document.querySelector(".p-action-big-container.active");
                if (opened_action.getAttribute("data-p-close-on-outside") == "true") {
                    event.stopPropagation();
                    opened_action.classList.remove("active");
                    document
                        .querySelector(".p-action-background")
                        .classList.remove("nowactive");
                    document.body.classList.remove("p-modal-opened");
                }
            });

        for (var action of actions) {
            action.addEventListener("click", function (event) {
                event.stopPropagation();
            });
        }
    })(document)

(function (d) {
  d.addEventListener("click", (e) => {
    let idTabs = Array.from(document.querySelectorAll(".p-tabs-container"));
    let identifier = e.target.parentElement.parentElement.id;

    idTabs.forEach((element) => {
      if (element.id === identifier) {
        let tabs = Array.from(element.children[0].children);
        let panels = Array.from(element.children[1].children);
        let i = tabs.indexOf(e.target);
        tabs.map((tab) => tab.classList.remove("p-is-active"));
        tabs[i].classList.add("p-is-active");
        panels.map((panel) => panel.classList.remove("p-is-active"));
        panels[i].classList.add("p-is-active");
      }
    });
  });
})(document);

let mobile_tabs_pupper = document.querySelectorAll('.p-mobile-tabs a');

for (var item of mobile_tabs_pupper) {
    item.addEventListener("click", function (event) {
      event.preventDefault();
      var remover_pupper = this.parentNode.parentNode;
      remover_pupper.querySelector('.active').classList.remove('active');
      this.classList.add('active');
      remover_pupper.parentNode.querySelector('.p-mobile-tabs--content.active').classList.remove('active');
      document.querySelector(this.getAttribute('data-p-mobile-toggle')).classList.add('active');
    });
}

(function (document) {
  var p_selector_modal = document.querySelectorAll("[data-p-open-modal]");
  var modals = document.querySelectorAll(".p-modal");
  var cancel_button = document.querySelectorAll("[data-p-cancel]");

  for (var item of p_selector_modal) {
    item.addEventListener("click", function (event) {
      event.preventDefault();
      var selector = this.getAttribute("data-p-open-modal");
      if (selector.length == 0) {
        console.warn(
          "Error. The data-p-open-modal attribute is empty, please add the ID of the modal you want to open."
        );
        return false;
      }
      document.querySelector(".p-modal-background").classList.add("nowactive");
      document.body.classList.add("p-modal-opened");
      document.querySelector(selector).classList.add("active");
    });
  }

  for (var element of cancel_button) {
    element.addEventListener("click", function (event) {
      event.preventDefault();
      document.querySelector(".p-modal.active").classList.remove("active");
      document.querySelector(".p-modal-background").classList.remove("nowactive");
      document.body.classList.remove("p-modal-opened");
    });
  }

  document
    .querySelector(".p-modal-background")
    .addEventListener("click", function (event) {
      event.preventDefault();
      var opened_modal = document.querySelector(".p-modal.active");
      if (opened_modal.getAttribute("data-p-close-on-outside") == "true") {
        event.stopPropagation();
        opened_modal.classList.remove("active");
        document
          .querySelector(".p-modal-background")
          .classList.remove("nowactive");
        document.body.classList.remove("p-modal-opened");
      }
    });

  for (var modal of modals) {
    modal.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  }
})(document)

(function (document) {
  var p_segmented_controls = document.querySelectorAll(".p-segmented-controls a");
  for (var item of p_segmented_controls) {
    item.addEventListener("click", function (event) {
      event.preventDefault();
      this.parentElement.querySelector("a.active").classList.remove("active");
      this.classList.add("active");
    });
  }

})(document)

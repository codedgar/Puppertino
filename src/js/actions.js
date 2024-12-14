    (function (document) {

        let p_actions = document.querySelectorAll("[data-p-open-actions]");
        let actions = document.querySelectorAll(".p-action-big-container");
        let cancel_action = document.querySelectorAll("[data-p-cancel-action]");

        for (const item of p_actions) {
            item.addEventListener("click", function (event) {
                event.preventDefault();
                let selector = this.getAttribute("data-p-open-actions");
                if (selector.length === 0) {
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

        for (const element of cancel_action) {
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
                let opened_action = document.querySelector(".p-action-big-container.active");
                if (opened_action.getAttribute("data-p-close-on-outside") === "true") {
                    event.stopPropagation();
                    opened_action.classList.remove("active");
                    document
                        .querySelector(".p-action-background")
                        .classList.remove("nowactive");
                    document.body.classList.remove("p-modal-opened");
                }
            });

        for (let action of actions) {
            action.addEventListener("click", function (event) {
                event.stopPropagation();
            });
        }
    })(document)
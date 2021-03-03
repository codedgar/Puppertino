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

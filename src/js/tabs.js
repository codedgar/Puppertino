(function(d) {
      d.addEventListener('click', e => {
        let idTabs = Array.from(document.querySelectorAll('.p-tabs-container'));
        let identifier = e.target.parentElement.parentElement.id;
    
        idTabs.forEach(element => {
          if(element.id === identifier) {
            let tabs = Array.from(element.children[0].children);
            let panels = Array.from(element.children[1].children);
            let i = tabs.indexOf(e.target);
            tabs.map(tab => tab.classList.remove('p-is-active'));
            tabs[i].classList.add('p-is-active');
            panels.map(panel => panel.classList.remove('p-is-active'));
            panels[i].classList.add('p-is-active');
          }
        })
      })
    })(document);

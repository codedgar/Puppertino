(function(d) {
  let tabs = Array.from(d.querySelectorAll('.p-tab'));
  let panels = Array.from(d.querySelectorAll('.p-panel'));
  d.querySelector('.p-tabs').addEventListener('click', e => {
    if(e.target.classList.contains('p-tab')) {
      let i = tabs.indexOf(e.target);
      console.log(i);
      tabs.map(tab => tab.classList.remove('p-is-active'));
      tabs[i].classList.add('p-is-active');
      panels.map(panel => panel.classList.remove('p-is-active'));
      panels[i].classList.add('p-is-active');
    }
  })
})(document)
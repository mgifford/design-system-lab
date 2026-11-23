/* Progressive enhancement for the component, experiment, and community-idea
 * directories. All entries are server-rendered and remain visible without JS. */
function countText(visible, total, noun) {
  return `${visible} of ${total} ${noun}${total === 1 ? '' : 's'}`;
}

function setup({formId, listId, countId, noun, filter}) {
  const form = document.getElementById(formId);
  const list = document.getElementById(listId);
  const count = document.getElementById(countId);
  if (!form || !list || !count) return;
  const items = [...list.querySelectorAll(':scope > .card')];
  const update = () => {
    let visible = 0;
    for (const item of items) {
      const show = filter(item, form);
      item.hidden = !show;
      if (show) visible += 1;
    }
    count.textContent = countText(visible, items.length, noun);
  };
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();
}

if (document.getElementById('component-filters')) {
  setup({
    formId: 'component-filters',
    listId: 'component-list',
    countId: 'component-count',
    noun: 'component',
    filter: (item, form) => {
      const group = form.querySelector('#component-group').value;
      const experiments = form.querySelector('#component-experiments').value;
      const groupMatch = group === 'all' || item.dataset.group === group;
      const experimentMatch = experiments === 'all' || item.dataset.experiments === experiments;
      return groupMatch && experimentMatch;
    }
  });
}

if (document.getElementById('experiment-filters')) {
  setup({
    formId: 'experiment-filters',
    listId: 'experiment-list',
    countId: 'experiment-count',
    noun: 'experiment',
    filter: (item, form) => {
      const type = form.querySelector('#experiment-type').value;
      const status = form.querySelector('#experiment-status').value;
      const preference = form.querySelector('#experiment-preference').value;
      const evidence = form.querySelector('#experiment-evidence').value;
      const concern = form.querySelector('#experiment-concern').value;
      const manual = form.querySelector('#experiment-manual').value;
      const preferences = (item.dataset.preferences || '').split(/\s+/).filter(Boolean);
      const concerns = (item.dataset.concerns || '').split(/\s+/).filter(Boolean);
      return (type === 'all' || item.dataset.type === type)
        && (status === 'all' || item.dataset.status === status)
        && (preference === 'all' || preferences.includes(preference))
        && (evidence === 'all' || item.dataset.automated === evidence)
        && (concern === 'all' || concerns.includes(concern))
        && (manual === 'all' || item.dataset.manual === manual);
    }
  });
}

if (document.getElementById('idea-filters')) {
  setup({
    formId: 'idea-filters',
    listId: 'ideas',
    countId: 'count',
    noun: 'curated issue',
    filter: (item, form) => {
      const status = form.querySelector('#status').value;
      const search = form.querySelector('#search').value.trim().toLowerCase();
      const openGroup = ['open', 'open-pr', 'discussion-continued'];
      const statusMatch = status === 'all'
        || (status === 'open' ? openGroup.includes(item.dataset.status) : item.dataset.status === status);
      const searchMatch = !search || (item.dataset.search || '').includes(search);
      return statusMatch && searchMatch;
    }
  });
}

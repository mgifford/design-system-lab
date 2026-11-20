document.documentElement.dataset.js = 'true';

const select = document.getElementById('preview-layout');
const compare = document.querySelector('.demo-compare');
if (select && compare) {
  select.addEventListener('change', () => {
    compare.dataset.layout = select.value;
  });
}

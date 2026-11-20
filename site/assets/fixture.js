// No framework. Markup remains in the HTML and survives when JavaScript is disabled.
const params=new URLSearchParams(location.search);
const theme=['light','dark','system'].includes(params.get('theme'))?params.get('theme'):'system';
const direction=params.get('dir')==='rtl'?'rtl':'ltr';
document.documentElement.lang='en'; // RTL emulates layout direction, not translation.
document.documentElement.dir=direction;
document.documentElement.dataset.mode=theme;
const name=document.querySelector('[data-component]')?.dataset.component;
// Form submission is intentionally local: never send test input to a government endpoint.
const form=document.getElementById('application');
if(form){form.addEventListener('submit',event=>{event.preventDefault();const ok=form.checkValidity();if(!ok){form.reportValidity();return}document.getElementById('form-status').textContent='Example submission validated locally. No data was sent.'})}
// An offline simulation is not USWDS and therefore uses an explicit fallback handler.
if(document.body.classList.contains('offline')){
 for(const button of document.querySelectorAll('.usa-accordion__button[aria-controls]')){
  button.addEventListener('click',()=>{const pane=document.getElementById(button.getAttribute('aria-controls'));if(!pane)return;const opened=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!opened));pane.hidden=opened})
 }
}

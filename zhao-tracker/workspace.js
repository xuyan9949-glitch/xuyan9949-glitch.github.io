const navIcons = ['▦', '◫', '↗', '◎', '▤', '≡'];
document.querySelectorAll('.section-nav-link').forEach((link,index) => {
  const icon=document.createElement('span');
  icon.className='nav-icon';
  icon.textContent=navIcons[index];
  icon.setAttribute('aria-hidden','true');
  link.prepend(icon);
});

const trends=document.getElementById('trends');
document.getElementById('holdings').after(trends);
document.getElementById('history').before(document.getElementById('closed'));

const note=document.createElement('div');
note.className='nav-note';
note.innerHTML='<span class="nav-note-icon">L</span><b>让记录，形成复利。</b><small>LUCKY FOLLOW · 投资工作台</small>';
document.querySelector('.section-nav').append(note);

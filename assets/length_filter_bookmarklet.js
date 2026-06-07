/*
 Mixcloud 45-minute filter (bookmarklet)
 ---------------------------------------
 On any Mixcloud profile page, this lists ONLY that artist's mixes at or above a
 minute threshold (default 45), pulled from the public API, with direct links.
 It also flags likely radio/talk uploads by title.

 INSTALL:
   Create a new bookmark and paste the one-liner below as the URL. Then open any
   Mixcloud profile (e.g. mixcloud.com/cosmobaker/) and click the bookmark.

 ONE-LINER (copy this whole thing as the bookmark URL):

 javascript:(function(){var MIN=45;var m=location.pathname.match(/^\/([^\/]+)\//);if(!m){alert('Open a Mixcloud profile first.');return;}var u=m[1];var bad=/radio|podcast|interview|\bshow\b|episode|\bep\.?\d|hot ?97|bbc|sirius/i;fetch('https://api.mixcloud.com/'+u+'/cloudcasts/?limit=100').then(function(r){return r.json()}).then(function(d){var rows=(d.data||[]).map(function(c){return{n:c.name,m:Math.round((c.audio_length||0)/60),url:c.url}}).filter(function(x){return x.m>=MIN}).sort(function(a,b){return b.m-a.m});var w=window.open('','_blank');var h='<h2>'+u+': '+rows.length+' mixes '+MIN+'m+</h2><ul style="font:15px system-ui">';rows.forEach(function(x){var flag=bad.test(x.n)?' <span style="color:#b91c1c">[maybe talk]</span>':'';h+='<li><a href="'+x.url+'" target="_blank">'+x.n+'</a> - '+x.m+'m'+flag+'</li>'});h+='</ul>';w.document.write(h);}).catch(function(e){alert('Error: '+e)})})();

 Change MIN at the start of the one-liner to set a different floor.
*/

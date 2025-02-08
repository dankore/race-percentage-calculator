// socialSharing.js

export function setupSocialSharing() {
  document.addEventListener('click', e => {
    const shareButton = e.target.closest('[data-share]');
    if (shareButton) {
      const platform = shareButton.dataset.share;
      shareContent(platform);
    }
  });
}

function shareContent(platform) {
  const url = window.location.href;
  const title = document.title;
  const text =
    'Calculate your exact ethnic makeup with this free ethnicity calculator. Perfect for mixed-race families and genealogy research!';

  const shareUrls = {
    facebook: `https://www.facebook.com/dialog/share?app_id=887993551754576&display=popup&href=${encodeURIComponent(
      url
    )}&redirect_uri=${encodeURIComponent(url)}`,
    twitter: `https://x.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`, // Updated to x.com
    email: `mailto:?subject=${encodeURIComponent(
      title
    )}&body=${encodeURIComponent(text + '\n\n' + url)}`,
    native: null,
  };

  if (platform === 'native' && navigator.share) {
    navigator
      .share({
        title: title,
        text: text,
        url: url,
      })
      .catch(console.error);
  } else if (shareUrls[platform]) {
    window.open(
      shareUrls[platform],
      '_blank',
      'width=600,height=500,location=yes,left=100,top=100'
    );
  }
}

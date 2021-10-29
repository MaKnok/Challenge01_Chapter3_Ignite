import { useEffect, useState } from 'react';

export const useUtterances = (commentNodeId: string): JSX.Element => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute('repo', 'MaKnok/space-traveling-comments');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', 'comentário :speech_balloon:');
    script.setAttribute('theme', 'github-dark');
    script.setAttribute('crossorigin', 'anonymous');

    const scriptParentNode = document.getElementById(commentNodeId);
    scriptParentNode.appendChild(script);

    return () => {
      // cleanup - remove the older script with previous theme
      scriptParentNode.removeChild(scriptParentNode.firstChild);
    };
  }, [visible]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(true);
          }
        });
      },
      { threshold: 1 }
    );
    observer.observe(document.getElementById(commentNodeId));
  }, [commentNodeId]);

  return <div id={commentNodeId} />;
};

/**
 * O‘zbekcha matnda bitta apostrof uslubi (interfeysdagi bilan bir xil):
 * o‘ va g‘ uchun ‘ (U+2018), tutuq belgisi uchun ’ (U+2019): «so'm» → «so‘m», «mablag'» → «mablag‘», «ta'lim» → «ta’lim».
 * Inglizcha egalik qo‘shimchasi («Rovio's») o‘zgarmaydi, faqat ’ ga aylanadi.
 */
export function uzQuotes(text: string) {
  if (!/['ʻʼ’`´]/.test(text)) return text;
  return (
    text
      .replace(/([OoGg])['ʻʼ’`´](?![sS]\b)(?=[A-Za-z])/g, '$1‘')
      // so‘z oxiridagi g‘: «mablag'», «tog'».
      .replace(/([Gg])['ʻʼ`´](?=[\s.,;:!?)»"]|$)/g, '$1‘')
      .replace(/([A-Za-z])['ʼ`´](?=[A-Za-z])/g, '$1’')
  );
}

const SKIP = new Set(['TEXTAREA', 'SCRIPT', 'STYLE', 'CODE', 'PRE', 'KBD', 'SAMP']);

/** Eski taqdimot sahifasidan kelgan DOM ichidagi ko‘rinadigan matnni bir uslubga keltiradi (kiritish maydonlariga tegmaydi). */
export function uzQuotesDom(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent || SKIP.has(parent.tagName) || parent.closest('[contenteditable]'))
        return NodeFilter.FILTER_REJECT;
      // Qiymati yozilmagan <option> matni uning qiymati hamdir — o‘zgartirilmaydi.
      if (parent.tagName === 'OPTION' && !parent.hasAttribute('value'))
        return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const next = uzQuotes(node.nodeValue || '');
    if (next !== node.nodeValue) node.nodeValue = next;
  }
  root.querySelectorAll<HTMLElement>('[title],[placeholder],[aria-label]').forEach((el) => {
    for (const name of ['title', 'placeholder', 'aria-label']) {
      const value = el.getAttribute(name);
      if (value) {
        const next = uzQuotes(value);
        if (next !== value) el.setAttribute(name, next);
      }
    }
  });
}

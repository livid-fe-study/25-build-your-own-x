export function render(element, container: HTMLElement) {
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type)

  const isProperty = (key) => key !== 'children'
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name]
    })

  for (const child of element.props.children) {
    render(child, dom)
  }

  container.appendChild(dom)
}

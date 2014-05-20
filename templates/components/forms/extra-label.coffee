class ExtraLabel
  constructor: (@el) ->
    t = this
    @el.parentNode.addEventListener 'click', (e) ->
      target = e.target || e.srcElement
      t.el.click() unless (target.nodeName=='INPUT' or target.nodeName=='LABEL')

new ExtraLabel(control) for control in document.querySelectorAll('input[type="radio"],input[type="checkbox"]')

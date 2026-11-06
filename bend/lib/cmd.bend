# Commands: everything the app asks the page to do. The app is pure; the
# host (host/runtime.js) carries these out against the DOM, the canvases and
# the network, and calls back into the app with what happened.
import Base
import ./scene.bend as S
import ./chart.bend as Ch

type Cmd is Data:
  CHtml{id: String, html: String}                  # el.innerHTML = html
  CAttr{id: String, name: String, value: String}   # el.setAttribute(name, value)
  CStyle{id: String, prop: String, value: String}  # el.style[prop] = value
  CSize{id: String, w: F32, h: F32}                # canvas.width, canvas.height
  CDraw{id: String, scene: S.Scene}                # the canvas's stage shows scene
  CTip{id: String, text: String}                   # new Opentip(el, text, ...)
  CFetch{file: String, url: String}                # GET url, no cache; answers fetched(file, ...)
  CEvery{key: String, ms: U32}                     # setInterval; answers timer(key, ...)
  CStop{key: String}                               # clearInterval
  COption{id: String, value: String, text: String} # select.add(option)
  CValue{id: String, value: String}                # select.value = value
  CChart{id: String, chart: Ch.Chart}              # a new Chart.js chart on the canvas
  CChartSize{id: String, w: String, h: String}     # resize a chart's div, then chart.resize()
  # Sets el[prop] (innerHTML, or style.fontSize, ...) to each value in turn,
  # stopping at the first that passes the test; the last value stays if none do.
  CFit{id: String, prop: String, values: +List<String>, test: Fit}
  # Fills each [data-date] cell under el with moment(date, parse).format(format),
  # in the page's moment locale.
  CDates{id: String, parse: String, format: String}
  CLog{text: String}                               # console.log
  CError{text: String}                             # console.error

# CFit's tests, which need the page's layout to answer.
type Fit is Data:
  # checkOverflow(el) is false
  FitsInside{}
  # !(container.clientHeight + 2 < el.clientHeight)
  FitsUnder{container: String}

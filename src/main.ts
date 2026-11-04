import './style.css'
import { bootstrap, startupFailed } from './bootstrap'
import { AppView } from './ui'

void bootstrap((root, store, retry) => new AppView(root, store, retry)).catch(startupFailed)

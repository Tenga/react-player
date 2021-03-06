import { Component } from 'react'

import { propTypes, defaultProps } from '../props'

const SEEK_ON_PLAY_EXPIRY = 5000

export default class Base extends Component {
  static propTypes = propTypes
  static defaultProps = defaultProps
  isReady = false
  startOnPlay = true
  seekOnPlay = null
  componentDidMount () {
    const { url } = this.props
    this.mounted = true
    if (url) {
      this.load(url)
    }
  }
  componentWillUnmount () {
    this.stop()
    this.mounted = false
  }
  componentWillReceiveProps (nextProps) {
    const { url, playing, volume, muted, playbackRate } = this.props
    // Invoke player methods based on incoming props
    if (url !== nextProps.url && nextProps.url) {
      this.seekOnPlay = null
      this.startOnPlay = true
      this.load(nextProps.url)
    }
    if (url && !nextProps.url) {
      this.stop()
      clearTimeout(this.updateTimeout)
    }
    if (!playing && nextProps.playing) {
      this.play()
    }
    if (playing && !nextProps.playing) {
      this.pause()
    }
    if (volume !== nextProps.volume && !nextProps.muted) {
      this.setVolume(nextProps.volume)
    }
    if (muted !== nextProps.muted) {
      this.setVolume(nextProps.muted ? 0 : nextProps.volume)
    }
    if (playbackRate !== nextProps.playbackRate) {
      this.setPlaybackRate(nextProps.playbackRate)
    }
  }
  shouldComponentUpdate (nextProps) {
    return this.props.url !== nextProps.url
  }
  seekTo (amount) {
    // When seeking before player is ready, store value and seek later
    if (!this.isReady && amount !== 0) {
      this.seekOnPlay = amount
      setTimeout(() => {
        this.seekOnPlay = null
      }, SEEK_ON_PLAY_EXPIRY)
    }
    // Return the seconds to seek to
    if (amount > 0 && amount < 1) {
      // Convert fraction to seconds based on duration
      return this.getDuration() * amount
    }
    return amount
  }
  onPlay = () => {
    const { volume, muted, onStart, onPlay, playbackRate } = this.props
    if (this.startOnPlay) {
      this.setPlaybackRate(playbackRate)
      this.setVolume(muted ? 0 : volume)
      onStart()
      this.startOnPlay = false
    }
    onPlay()
    if (this.seekOnPlay) {
      this.seekTo(this.seekOnPlay)
      this.seekOnPlay = null
    }
    this.onDurationCheck()
  }
  onReady = () => {
    const { onReady, playing } = this.props
    this.isReady = true
    this.loadingSDK = false
    onReady()
    if (playing || this.preloading) {
      this.preloading = false
      if (this.loadOnReady) {
        this.load(this.loadOnReady)
        this.loadOnReady = null
      } else {
        this.play()
      }
    }
    this.onDurationCheck()
  }
  onDurationCheck = () => {
    clearTimeout(this.durationCheckTimeout)
    const duration = this.getDuration()
    if (duration) {
      this.props.onDuration(duration)
    } else {
      this.durationCheckTimeout = setTimeout(this.onDurationCheck, 100)
    }
  }
}

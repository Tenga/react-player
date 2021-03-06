import React, { Component } from 'react'

import { propTypes, defaultProps, DEPRECATED_CONFIG_PROPS } from './props'
import { getConfig, omit } from './utils'
import YouTube from './players/YouTube'
import SoundCloud from './players/SoundCloud'
import Vimeo from './players/Vimeo'
import Facebook from './players/Facebook'
import FilePlayer from './players/FilePlayer'
import Streamable from './players/Streamable'
import Vidme from './players/Vidme'
import Wistia from './players/Wistia'
import DailyMotion from './players/DailyMotion'
import Twitch from './players/Twitch'

const SUPPORTED_PROPS = Object.keys(propTypes)
const SUPPORTED_PLAYERS = [
  YouTube,
  SoundCloud,
  Vimeo,
  Facebook,
  Streamable,
  Vidme,
  Wistia,
  Twitch,
  DailyMotion
]

export default class ReactPlayer extends Component {
  static displayName = 'ReactPlayer'
  static propTypes = propTypes
  static defaultProps = defaultProps
  static canPlay = url => {
    const players = [...SUPPORTED_PLAYERS, FilePlayer]
    for (let Player of players) {
      if (Player.canPlay(url)) {
        return true
      }
    }
    return false
  }
  config = getConfig(this.props, defaultProps, true)
  componentDidMount () {
    this.progress()
  }
  componentWillUnmount () {
    clearTimeout(this.progressTimeout)
  }
  shouldComponentUpdate (nextProps) {
    return (
      this.props.url !== nextProps.url ||
      this.props.playing !== nextProps.playing ||
      this.props.volume !== nextProps.volume ||
      this.props.muted !== nextProps.muted ||
      this.props.playbackRate !== nextProps.playbackRate ||
      this.props.height !== nextProps.height ||
      this.props.width !== nextProps.width ||
      this.props.hidden !== nextProps.hidden
    )
  }
  seekTo = fraction => {
    if (!this.player) return null
    this.player.seekTo(fraction)
  }
  getDuration = () => {
    if (!this.player) return null
    return this.player.getDuration()
  }
  getCurrentTime = () => {
    if (!this.player) return null
    const duration = this.player.getDuration()
    const fractionPlayed = this.player.getFractionPlayed()
    if (duration === null || fractionPlayed === null) {
      return null
    }
    return fractionPlayed * duration
  }
  getInternalPlayer = () => {
    if (!this.player) return null
    return this.player.player
  }
  progress = () => {
    if (this.props.url && this.player) {
      const loaded = this.player.getFractionLoaded() || 0
      const played = this.player.getFractionPlayed() || 0
      const duration = this.player.getDuration()
      const progress = {}
      if (loaded !== this.prevLoaded) {
        progress.loaded = loaded
        if (duration) {
          progress.loadedSeconds = progress.loaded * duration
        }
      }
      if (played !== this.prevPlayed) {
        progress.played = played
        if (duration) {
          progress.playedSeconds = progress.played * duration
        }
      }
      if (progress.loaded || progress.played) {
        this.props.onProgress(progress)
      }
      this.prevLoaded = loaded
      this.prevPlayed = played
    }
    this.progressTimeout = setTimeout(this.progress, this.props.progressFrequency)
  }
  renderActivePlayer (url) {
    if (!url) return null
    for (let Player of SUPPORTED_PLAYERS) {
      if (Player.canPlay(url)) {
        return this.renderPlayer(Player)
      }
    }
    // Fall back to FilePlayer if nothing else can play the URL
    return this.renderPlayer(FilePlayer)
  }
  renderPlayer = Player => {
    return (
      <Player
        {...this.props}
        ref={this.activePlayerRef}
        key={Player.displayName}
        config={this.config}
      />
    )
  }
  activePlayerRef = player => {
    this.player = player
  }
  wrapperRef = wrapper => {
    this.wrapper = wrapper
  }
  renderPreloadPlayers (url) {
    // Render additional players if preload config is set
    const preloadPlayers = []
    if (!YouTube.canPlay(url) && this.config.youtube.preload) {
      preloadPlayers.push(YouTube)
    }
    if (!Vimeo.canPlay(url) && this.config.vimeo.preload) {
      preloadPlayers.push(Vimeo)
    }
    if (!DailyMotion.canPlay(url) && this.config.dailymotion.preload) {
      preloadPlayers.push(DailyMotion)
    }
    return preloadPlayers.map(this.renderPreloadPlayer)
  }
  renderPreloadPlayer = Player => {
    return (
      <Player
        key={Player.displayName}
        config={this.config}
      />
    )
  }
  render () {
    const { url, style, width, height } = this.props
    const otherProps = omit(this.props, SUPPORTED_PROPS, DEPRECATED_CONFIG_PROPS)
    const activePlayer = this.renderActivePlayer(url)
    const preloadPlayers = this.renderPreloadPlayers(url)
    return (
      <div ref={this.wrapperRef} style={{ ...style, width, height }} {...otherProps}>
        {activePlayer}
        {preloadPlayers}
      </div>
    )
  }
}

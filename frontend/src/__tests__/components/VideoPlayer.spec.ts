import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VideoPlayer from '../../components/episodes/VideoPlayer.vue'

describe('VideoPlayer', () => {
  it('renders player with Mux playback ID', () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        playbackId: 'test-playback-id',
        status: 'ready',
      },
    })

    // Should render a video element
    const video = wrapper.find('video')
    expect(video.exists()).toBe(true)

    // Should use the correct stream URL
    expect(video.attributes('src')).toBe(
      'https://stream.mux.com/test-playback-id.m3u8'
    )

    // Should have poster
    expect(video.attributes('poster')).toContain('test-playback-id')

    // Should have controls
    expect(video.attributes('controls')).toBeDefined()
  })

  it('shows placeholder when no video available', () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        playbackId: null,
        status: 'draft',
      },
    })

    // Should not render video element
    expect(wrapper.find('video').exists()).toBe(false)

    // Should show placeholder text
    expect(wrapper.text()).toContain('No video available')
  })

  it('shows processing state', () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        playbackId: null,
        status: 'processing',
      },
    })

    // Should not render video element
    expect(wrapper.find('video').exists()).toBe(false)

    // Should show processing message
    expect(wrapper.text()).toContain('Processing video')
    expect(wrapper.text()).toContain('This may take a few minutes')

    // Should have the spinner animation
    const spinner = wrapper.find('.animate-spin')
    expect(spinner.exists()).toBe(true)
  })

  it('renders responsive container', () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        playbackId: 'test-id',
        status: 'ready',
      },
    })

    // Should have aspect-video class for 16:9 ratio
    const container = wrapper.find('.aspect-video')
    expect(container.exists()).toBe(true)
  })

  it('track info bar renders with audio track count', () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        playbackId: 'test-id',
        status: 'ready',
        audioTracks: [
          { id: 'a1', language_code: 'ar', label: 'Arabic', file_url: 'http://s3/ar.mp3', is_default: true },
          { id: 'a2', language_code: 'en', label: 'English', file_url: 'http://s3/en.mp3', is_default: false },
        ],
        subtitleTracks: [],
      },
    })

    expect(wrapper.text()).toContain('2 audio')
  })

  it('track info bar renders with subtitle count', () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        playbackId: 'test-id',
        status: 'ready',
        audioTracks: [],
        subtitleTracks: [
          { id: 's1', language_code: 'ar', label: 'Arabic', file_url: 'http://s3/ar.vtt', format: 'vtt', is_default: true },
          { id: 's2', language_code: 'en', label: 'English', file_url: 'http://s3/en.srt', format: 'srt', is_default: false },
          { id: 's3', language_code: 'fr', label: 'French', file_url: 'http://s3/fr.vtt', format: 'vtt', is_default: false },
        ],
      },
    })

    expect(wrapper.text()).toContain('3 subtitles')
  })

  it('VTT subtitle tracks render as <track> elements with default attribute', () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        playbackId: 'test-id',
        status: 'ready',
        audioTracks: [],
        subtitleTracks: [
          { id: 's1', language_code: 'ar', label: 'Arabic', file_url: 'http://s3/ar.vtt', format: 'vtt', is_default: true },
          { id: 's2', language_code: 'en', label: 'English', file_url: 'http://s3/en.srt', format: 'srt', is_default: false },
          { id: 's3', language_code: 'fr', label: 'French', file_url: 'http://s3/fr.vtt', format: 'vtt', is_default: false },
        ],
      },
    })

    // Only VTT subtitles should render as <track> elements (not SRT)
    const trackElements = wrapper.findAll('track')
    expect(trackElements.length).toBe(2)

    // Check the default VTT track
    const defaultTrack = trackElements.find(t => t.attributes('srclang') === 'ar')
    expect(defaultTrack).toBeDefined()
    expect(defaultTrack!.attributes('src')).toBe('http://s3/ar.vtt')
    expect(defaultTrack!.attributes('label')).toBe('Arabic')
    expect(defaultTrack!.attributes('default')).toBeDefined()

    // Check the non-default VTT track
    const frenchTrack = trackElements.find(t => t.attributes('srclang') === 'fr')
    expect(frenchTrack).toBeDefined()
    expect(frenchTrack!.attributes('src')).toBe('http://s3/fr.vtt')
    expect(frenchTrack!.attributes('default')).toBeUndefined()
  })
})

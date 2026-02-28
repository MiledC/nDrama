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
})

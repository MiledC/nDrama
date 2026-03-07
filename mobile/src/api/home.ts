import api from './client';
import type {HomeSection} from '../types/api';

/** Get home page sections with content. */
export async function getHomeSections(): Promise<HomeSection[]> {
  const {data} = await api.get<HomeSection[]>('/home/sections');
  return data;
}
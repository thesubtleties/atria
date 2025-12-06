/**
 * Typed hooks for Redux and common patterns
 *
 * Usage:
 *   import { useAppDispatch, useAppSelector } from '@/types/hooks';
 *
 *   In components:
 *   const dispatch = useAppDispatch();
 *   const user = useAppSelector(selectUser);
 */

import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from 'react-redux';
import type { RootState } from './store';

// Placeholder type for dispatch until store is fully typed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppDispatch = any;

/**
 * Typed dispatch hook - use this instead of useDispatch
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * Typed selector hook - use this instead of useSelector
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;


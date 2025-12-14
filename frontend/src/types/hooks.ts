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

import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/store';

/**
 * Typed dispatch hook - use this instead of useDispatch
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * Typed selector hook - use this instead of useSelector
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

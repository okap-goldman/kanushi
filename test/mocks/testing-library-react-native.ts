import { vi } from 'vitest';

export const render = vi.fn((component: any) => ({
  getByTestId: vi.fn((testId: string) => ({})),
  getByText: vi.fn((text: string) => ({})),
  getByLabelText: vi.fn((label: string) => ({})),
  getByPlaceholderText: vi.fn((placeholder: string) => ({})),
  getByDisplayValue: vi.fn((value: string) => ({})),
  queryByTestId: vi.fn((testId: string) => null),
  queryByText: vi.fn((text: string) => null),
  findByTestId: vi.fn(async (testId: string) => ({})),
  findByText: vi.fn(async (text: string) => ({})),
  getAllByTestId: vi.fn((testId: string) => []),
  getAllByText: vi.fn((text: string) => []),
  unmount: vi.fn(),
  rerender: vi.fn(),
  debug: vi.fn(),
  toJSON: vi.fn(() => ({})),
  container: {},
  baseElement: {},
}));

export const fireEvent = Object.assign(
  vi.fn((element: any, eventName: string, ...args: any[]) => {
    // General fireEvent function for custom events
    if (element && element[eventName]) {
      element[eventName](...args);
    }
  }),
  {
    press: vi.fn(),
    changeText: vi.fn(),
    scroll: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
  }
);

export const waitFor = vi.fn(async (callback: () => void) => {
  await callback();
});

export const act = vi.fn(async (callback: () => void | Promise<void>) => {
  await callback();
});

export const cleanup = vi.fn();
/**
 * Optional provider interface reserved for future AI features
 * (plain-language summaries, error explanations, …).
 *
 * The deterministic humanization engine is the default and works
 * entirely without this. No AI SDK is installed and no network calls
 * are made anywhere in the application.
 */
export class ExplanationProvider {
  // eslint-disable-next-line no-unused-vars
  async explain(input, options = {}) {
    throw new Error('Not implemented')
  }
}

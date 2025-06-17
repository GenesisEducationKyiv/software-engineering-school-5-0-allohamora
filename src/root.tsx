import type { FC } from 'hono/jsx';
import { html } from 'hono/html';
import { Frequency } from './db.schema.js';

export const Root: FC = () => {
  return (
    <>
      {html`<!doctype html>`}
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <link rel="icon" href="/favicon.ico" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Weather App</title>
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        </head>
        <body class="bg-gradient-to-br from-teal-300 to-blue-800 min-h-screen flex items-center justify-center text-gray-800 bg-cover bg-center animate-gradient-x">
          <div class="container max-w-md w-full px-4 py-5">
            <div class="bg-white rounded-lg shadow-lg overflow-hidden border-t-4 border-blue-500">
              <div class="px-6 pt-8 pb-4 text-center">
                <h1 class="text-2xl font-semibold text-blue-500 mb-2 tracking-wide">Weather Updates</h1>
                <p class="text-gray-500 font-light leading-relaxed">Subscribe to get weather updates for your city</p>
              </div>
              <div class="px-6 pb-8">
                <form id="subscribe-form" method="post" action="/api/subscribe" class="space-y-4">
                  <div class="mb-5">
                    <label for="email" class="block mb-2 font-medium text-gray-700 tracking-wide">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      placeholder="yourname@example.com"
                      required
                    />
                  </div>
                  <div class="mb-5">
                    <label for="city" class="block mb-2 font-medium text-gray-700 tracking-wide">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      placeholder="Enter your city"
                      required
                    />
                  </div>
                  <div class="mb-6">
                    <label for="frequency" class="block mb-2 font-medium text-gray-700 tracking-wide">Update Frequency</label>
                    <select
                      id="frequency"
                      name="frequency"
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      required
                    >
                      <option value={Frequency.Daily}>Daily Updates</option>
                      <option value={Frequency.Hourly}>Hourly Updates</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    class="w-full py-3 px-6 text-white font-medium tracking-wider bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-800 cursor-pointer relative"
                  >
                    Subscribe Now
                  </button>
                </form>
              </div>
            </div>
            <div class="text-center mt-5 text-white/80 text-sm tracking-wide">
              <p>&copy; {new Date().getFullYear()} Weather Subscription Service</p>
            </div>
          </div>
        </body>
      </html>
    </>
  );
};

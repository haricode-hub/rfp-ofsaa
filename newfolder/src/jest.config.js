module.exports = {
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": [
    "<rootDir>/jest.setup.js"
  ],
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  "testPathIgnorePatterns": [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/"
  ],
  "collectCoverageFrom": [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts"
  ],
  "transform": {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      {
        "presets": [
          "next/babel"
        ]
      }
    ]
  }
}
import adapter from "@sveltejs/adapter-static";

const config = {
  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: undefined,
      precompress: false,
      strict: true
    }),
    paths: {
      base: process.env.NODE_ENV === "production" ? "/tech-bento" : ""
    }
  }
};

export default config;

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const fse = require('fs-extra');
const { GenerateSW } = require('workbox-webpack-plugin');
const SitemapPlugin = require('sitemap-webpack-plugin').default;

class RunAfterCompile {
  apply(compiler) {
    compiler.hooks.done.tap('Copy files', function () {
      fse.copySync(
        './src/assets/styles/main.css',
        './dist/assets/styles/main.css'
      );
    });
  }
}

const pages = [
  {
    filename: 'index.html',
    template: './src/html/index.html',
  },
  {
    filename: 'blog/index.html',
    template: './src/html/blog/index.html',
  },
  {
    filename: 'blog/genealogy-research-tips/index.html',
    template: './src/html/blog/genealogy-research-tips.html',
  },
  {
    filename: 'blog/understanding-dna-tests/index.html',
    template: './src/html/blog/understanding-dna-tests.html',
  },
  {
    filename: 'blog/cultural-heritage-resources/index.html',
    template: './src/html/blog/cultural-heritage-resources.html',
  },
];

const generateHtmlPlugins = () =>
  pages.map(page => new HtmlWebpackPlugin({ ...page }));

const paths = [
  {
    path: '/',
    lastmod: new Date().toISOString(),
    priority: 1.0,
    changefreq: 'daily',
  },
  {
    path: '/blog',
    lastmod: new Date().toISOString(),
    priority: 0.9,
    changefreq: 'weekly',
  },
  {
    path: '/blog/genealogy-research-tips',
    lastmod: new Date().toISOString(),
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: '/blog/understanding-dna-tests',
    lastmod: new Date().toISOString(),
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: '/blog/cultural-heritage-resources',
    lastmod: new Date().toISOString(),
    priority: 0.8,
    changefreq: 'monthly',
  },
];

const timestamp = new Date().toISOString();
const sitemapHeaders = {
  '<?xml-stylesheet type="text/xsl" href="sitemap.xsl"?>': false,
  [`<!-- generated-on="${timestamp}" -->`]: true,
};

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  console.log({ isProduction });

  const plugins = [
    ...generateHtmlPlugins(),
    new SitemapPlugin({
      base: 'https://race-calculator.dankoresoft.com',
      paths,
      options: {
        filename: 'sitemap.xml',
        lastmod: true,
        changefreq: 'daily',
        priority: 0.8,
        skipgzip: false,
        spacing: '  ',
        xmlNs: `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"`,
        formatOutput: true,
        headers: sitemapHeaders,
      },
    }),
  ];

  if (isProduction) {
    plugins.push(
      new RunAfterCompile(),
      new CopyPlugin({
        patterns: [
          {
            from: 'src/assets/images',
            to: 'assets/images',
            globOptions: {
              ignore: ['**/.DS_Store', '**/Thumbs.db'],
            },
          },
          { from: 'src/robots.txt', to: 'robots.txt' },
          {
            from: 'src/assets/images/icons/manifest.json',
            to: 'manifest.json',
          },
        ],
      }),
      new GenerateSW({
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: new RegExp(
              '^https://ethnicity-calculator\\.dankoresoft\\.com/'
            ),
            handler: 'StaleWhileRevalidate',
          },
        ],
      })
    );
  }

  return {
    entry: './src/js/main.js',
    output: {
      publicPath: '/',
      filename: 'bundle.[contenthash].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
        {
          test: /\.(gif|png|jpe?g|svg|ico)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 8kb
            },
          },
          generator: {
            filename: 'assets/images/[name].[hash][ext]',
          },
        },
      ],
    },
    plugins,
    devServer: {
      static: {
        directory: path.join(__dirname, 'src'),
      },
      compress: true,
      port: 9000,
      hot: true,
      historyApiFallback: true,
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxAssetSize: 512000,
      maxEntrypointSize: 512000,
    },
    optimization: {
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },
  };
};

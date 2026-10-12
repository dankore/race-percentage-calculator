const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const fse = require('fs-extra');
const { GenerateSW } = require('workbox-webpack-plugin');
const SitemapPlugin = require('sitemap-webpack-plugin').default;
const TerserPlugin = require('terser-webpack-plugin');

// Remove the manual CSS copying class since we'll use MiniCssExtractPlugin

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
  {
    filename: 'dna-import/index.html',
    template: './src/html/dna-import.html',
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
  {
    path: '/dna-import',
    lastmod: new Date().toISOString(),
    priority: 0.85,
    changefreq: 'weekly',
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
    new MiniCssExtractPlugin({
      filename: 'assets/styles/main.[contenthash].css',
      chunkFilename: 'assets/styles/[id].[contenthash].css',
    }),
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
        { from: 'src/assets/images/icons/favicon.ico', to: 'favicon.ico' },
        {
          from: 'src/assets/images/icons/manifest.json',
          to: 'assets/images/icons/manifest.json',
        },
        { 
          from: 'src/.well-known',
          to: '.well-known',
        },
      ],
    }),
  ];

  if (isProduction) {
    plugins.push(
      new GenerateSW({
        clientsClaim: true,
        skipWaiting: true,
        swDest: 'service-worker.js',
        exclude: [/^assets\/images\//, /\.gz$/, /^js\/(chart|html2canvas)\./, /^\.well-known\//],
        runtimeCaching: [
          {
            urlPattern: new RegExp(
              '^https://race-calculator\\.dankoresoft\\.com/'
            ),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'site-cache',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            },
          },
          {
            urlPattern: /^https?:\/\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'external-resources',
              networkTimeoutSeconds: 10,
            },
          },
        ],
      })
    );
  }

  const config = {
    entry: {
      main: './src/js/main.js',
      styles: './src/css/main.css'
    },
    output: {
      publicPath: '/',
      filename: 'js/[name].[contenthash].js',
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
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader'
          ],
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
      static: [
        {
          directory: path.join(__dirname, 'dist'),
          publicPath: '/',
        },
        {
          directory: path.join(__dirname, 'src/assets'),
          publicPath: '/assets',
        },
      ],
      compress: true,
      port: 9000,
      hot: true,
      historyApiFallback: {
        rewrites: [
          { from: /^\/dna-import$/, to: '/dna-import/index.html' },
          { from: /^\/blog$/, to: '/blog/index.html' },
          {
            from: /^\/blog\/genealogy-research-tips$/,
            to: '/blog/genealogy-research-tips/index.html',
          },
          {
            from: /^\/blog\/understanding-dna-tests$/,
            to: '/blog/understanding-dna-tests/index.html',
          },
          {
            from: /^\/blog\/cultural-heritage-resources$/,
            to: '/blog/cultural-heritage-resources/index.html',
          },
        ],
      },
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
            chunks: 'initial',
          },
        },
      },
    },
  };

  if (isProduction) {
    config.optimization.minimize = true;
    config.optimization.minimizer = [
      new TerserPlugin({
        parallel: false,
        extractComments: false,
        terserOptions: {
          compress: {
            passes: 2,
            drop_console: true,
          },
          format: {
            comments: false,
          },
        },
      }),
    ];
  } else {
    config.optimization.minimize = false;
  }

  return config;
};

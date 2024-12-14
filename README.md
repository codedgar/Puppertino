
![Puppertino Stars](https://img.shields.io/github/stars/codedgar/puppertino?style=for-the-badge) ![Puppertino's contributors](https://img.shields.io/github/contributors/codedgar/puppertino?style=for-the-badge)   [![Follow Puppertino_css](https://img.shields.io/twitter/follow/Puppertino_css?style=for-the-badge)](https://twitter.com/Puppertino_css) [![Follow Codedgar_dev](https://img.shields.io/twitter/follow/codedgar_dev?style=for-the-badge)](https://twitter.com/codedgar_dev) [![Visit the creator's Website](https://img.shields.io/badge/Visit%20the%20Creator's%20Website-blue?style=for-the-badge&logo=undertale&logoColor=white)](https://codedgar.com/)
![Puppertino Logo](https://i.imgur.com/r81X3Yj.png)

# Welcome to Puppertino Siberian by Codedgar


Welcome to **Puppertino**! This framework brings the macOS look and feel to your web applications, adhering closely to Apple’s Human Interface Guidelines. Designed to be lightweight and modular, Puppertino provides a seamless user experience with a focus on performance and style.

## Key Framework Features
- **Lightweight**: Puppertino is built with performance in mind. By avoiding unnecessary additions or dependencies, Puppertino ensures your website or app remains fast and responsive. You get the macOS-inspired design without compromising on speed and efficiency.
- **Modular**: Flexibility is at the heart of Puppertino. Whether you need the entire framework or just specific components, you can pick and choose what fits your project. This modular approach allows you to minimize the size of your website, ensuring that you only include what’s necessary.
- **Design-Focused**: Puppertino is not just about functionality—it’s about looking cool too! Inspired by macOS, the framework prioritizes a sleek and modern design, with room for creative enhancements beyond macOS guidelines when needed.

## Table of contents

- [Get Started](#get-started)
- [Current Components](#current-components)
- [Examples and templates](https://codedgar.github.io/Puppertino/examples/)
- [About the creator](#about-the-creator)

## Get Started

To integrate Puppertino into your project, simply include the full.css file in your HTML head tag:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/codedgar/Puppertino@latest/dist/css/newfull.css">
```
### Customize your setup
If you only need specific components, you can import them individually to reduce file size. Here’s how you can include only the buttons:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/codedgar/Puppertino@latest/dist/css/buttons.css">
```

You can also find the full list of individual components and their CDN links on the [Components page](https://codedgar.github.io/Puppertino/examples/).

### NPM

You can install this repository through NPM + GIT:
```bash
# Via SSH
npm i --save git@github.com:codedgar/Puppertino.git#{{BRANCH_NAME}}

# Eg.
npm i --save git@github.com:codedgar/Puppertino.git#master

# Or Via HTTPS
npm i --save https://github.com/codedgar/Puppertino.git#BRANCH_NAME

# Eg.
npm i --save https://github.com/codedgar/Puppertino.git#master
```

You can change master with the branch of your choosing to install a specific branch. After NPM installation,
you can simply import the library from `node_modules`

#### In your CSS
```css
@import("path/to/node_modules/puppertino/dist/full.css")
```
#### In your Javascript
```js
require("path/to/node_modules/puppertino/src/js/{{file you need, eg tabs.js}}")
```

## Current Components

Puppertino currently includes the following components:

- Buttons (Push, Icon, Action)
- Modals
- Forms and Inputs
- Layout
- Official Apple Colors
- Segmented Controls
- Shadows & Blur
- Tabs
- Navigation Bars
- Dark Mode Manager

For a full list and detailed usage instructions, check out the [Components page](https://codedgar.github.io/Puppertino/examples/).

If you can't find a component that you want, you can always [create an issue](https://github.com/codedgar/Puppertino/issues/new/choose) to vote for the new components.

## Examples and templates

Find detailed examples and templates to help you get started quickly with Puppertino.

Explore the examples at [Puppertino Examples](https://codedgar.github.io/Puppertino/examples/).

## License

Puppertino is open-source and available under the [open-source MIT license](https://github.com/codedgar/Puppertino/blob/master/LICENSE), allowing you to freely use and modify the framework for your projects.

## Contributing

We welcome contributions! If you’d like to contribute to Puppertino, check out the [Contribution Guidelines](https://github.com/codedgar/Puppertino/blob/master/CONTRIBUTING.md) to learn how to get involved.

## About the creator

Puppertino was developed by [Codedgar](https://codedgar.com/), a web developer passionate about creating clean, elegant web experiences. As the framework continues to evolve, more features and components will be added—so stay tuned for regular updates!
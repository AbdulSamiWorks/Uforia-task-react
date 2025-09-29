# Canva Clone: A ReactJS exercise project for Fresh Trainees

This project is a simplified clone of Canva, a popular design tool. It provides a foundation for implementing various design functionalities similar to Canva.

## Project Overview

The Canva Clone is a web application that allows users to create designs by adding, editing, and manipulating text, shapes, and images on a canvas. The application has a user interface similar to Canva with a top bar, left menu for tools, and a main canvas area. 

## Project Structure

```
src/
├── assets/         # Images, icons, and other static files
├── components/     # React components
│   ├── Canvas/     # Canvas area components
│   ├── LeftMenu/   # Left menu components
│   ├── TopBar/     # Top bar components
├── styles/         # Global styles
```

## Fabric JS understanding
Although you can write custom code to draw on HTML5 Canvas but i will highly recommend using Fabric.jS library. Fabric.js provides out-of-the-box features for creating and manipulating graphical elements, such as shapes, text, and images. This eliminates the need to build fundamental functionalities like object resizing, rotation, and grouping from scratch.

I would recommend going through this FabricJS tutorial series. It can help you understand the basics of FabricJS. You can watch the whole series before starting the project, or go through the series while developing the project. https://youtube.com/playlist?list=PLOmd6EbLLA_oLtJ9howoPC01788f1dtEz&si=89u5n9C1Sf6J61vG

## Getting Started

To run this project locally:

1. Clone this repository
2. Install dependencies with `npm install`
3. Start the development server with `npm start`
4. Open [http://localhost:3000](http://localhost:3000) to view it in your browser

## Developer Requirements

As a developer, you are required to implement the following functionalities:

### Functional Requirements

Add FabricJS Plugin

1. **Text Element**
   - Add text to the canvas
   - Delete text from the canvas
   - Change font family
   - Change text color
   - Edit text content
   - Change font size
   - Apply text formatting (underline, bold, italic)

2. **Shape Element**
   - Add shapes (circle, square, rectangle) to the canvas
   - Delete shapes from the canvas
   - Change shape fill color
   - Change shape outline color
   - Resize shapes

3. **Image Element**
   - Add images by upload
   - Delete images from the canvas
   - Resize images
   - Apply opacity to images

4. **Layers Functionality**
   - Move layers up and down
   - Lock layers to prevent editing
   - Hide layers

### Non-Functional Requirements

1. Code should be clean, readable, and properly formatted
2. Follow the AirBnB style guide for React.js
3. Ensure the application is responsive
4. Implement proper error handling
5. Write meaningful comments
6. Use proper naming conventions for variables, functions, and components

## Implementation Guidelines

- Use React hooks for state management
- Create reusable components
- Implement drag and drop functionality for elements
- Use CSS modules or styled-components for styling
- Ensure proper event handling for user interactions

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production

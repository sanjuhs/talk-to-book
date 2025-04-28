# Talk to Book 📚

<div align="center">
  <img src="public/hero.png" alt="Talk to Book Logo" width="200"/>
  <p><em>Your AI-powered reading companion</em></p>
</div>

Talk to Book is an innovative application that allows you to have natural conversations with your documents. Whether you're reading PDFs, HTML files, or web content, this tool helps you interact with your reading material in a more engaging and intuitive way.

## Features

- 🎙️ Voice conversations with your documents
- 📄 Support for PDF and HTML files
- 🌐 Web content scraping and analysis
- 🔄 Real-time text extraction and processing
- 🎯 Multiple view modes (single page, double page, strip view)
- 📝 Note-taking capabilities
- 🔍 Context-aware responses
- 🎨 Multiple AI providers support (OpenAI and Outspeed)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/talk-to-book.git
cd talk-to-book
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your API keys:

```env
OPENAI_API_KEY=your_openai_api_key_here
OUTSPEED_API_KEY=your_outspeed_api_key_here
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

> **Note**: Please ignore the vending machine page - it's a static demo page that exists for testing purposes.

## Project Structure

### Documentation

Feel free to add your own documentation under the `/documentation` folder. This can include:

- API documentation
- Architecture diagrams
- User guides
- Development guidelines
- Testing procedures
- Deployment instructions

### Configuration

You can customize the application behavior by modifying:

- `.cursor/` - Cursor-specific settings and configurations
- `.windsurf/` - Windsurf configuration files
- `tailwind.config.js` - Tailwind CSS customization
- `next.config.js` - Next.js configuration

## Known Issues & Future Improvements

The current interface is in early development and needs significant improvements:

- 🔧 UI/UX needs major cleanup and refinement
- 📱 Mobile responsiveness requires implementation
- 🎨 Design system needs to be standardized
- 🔄 State management could be more efficient
- 🎙️ Voice interaction can be more intuitive
- 📊 Progress tracking needs better visualization
- 🗃️ Document management system needs implementation
- 👥 Multi-user support planned
- 🔐 Better security measures needed
- 📈 Performance optimizations required
- 🌐 Offline support consideration
- 🔍 Advanced search capabilities planned

## Contributing

We welcome contributions! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation
- Add new configuration rules
- Enhance existing features

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Outspeed Documentation](https://docs.outspeed.com)

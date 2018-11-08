using Tesseract;

namespace gpii.tesseract
{
    using System;
    using System.Drawing;
    using System.IO;
    using System.Reflection;
    using System.Runtime.InteropServices;
    using System.Threading.Tasks;

    public class Screen
    {
        private static TesseractEngine engine;
        private static Bitmap screenImage;

        private const int SM_CXSCREEN = 0;
        private const int SM_CYSCREEN = 1;

        [DllImport("user32.dll")]
        private static extern int GetSystemMetrics(int smIndex);

        public async Task<object> Capture(dynamic input)
        {
            int width = GetSystemMetrics(SM_CXSCREEN);
            int height = GetSystemMetrics(SM_CYSCREEN);
            string filename = input.imageFile;

            screenImage = new Bitmap(width, height);
            using (Graphics g = Graphics.FromImage(screenImage))
            {
                g.CopyFromScreen(Point.Empty, Point.Empty, new Size(width, height));
            }

            screenImage.Save(filename, System.Drawing.Imaging.ImageFormat.Png);
            return null;
        }

        public async Task<object> InitEngine(dynamic input)
        {
            string dataDir = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), "tessdata");

            engine = new TesseractEngine(dataDir, "eng", EngineMode.Default)
            {
                DefaultPageSegMode = PageSegMode.SingleBlock
            };

            return null;
        }

        public async Task<object> GetText(dynamic input)
        {
            Rectangle rect = Rectangle.FromLTRB(input.x, input.y, input.x + input.width, input.y + input.height);

            // Copy a portion of the screen.
            Bitmap bmp = new Bitmap(rect.Width, rect.Height);
            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.DrawImage(screenImage, 0, 0, rect, GraphicsUnit.Pixel);
            }

            Pix pix = null;

            try
            {
                pix = PixConverter.ToPix(bmp).ConvertRGBToGray().Scale(4, 4);
            }
            catch (Exception e)
            {
                if (e.InnerException == null)
                {
                    throw;
                }
                else
                {
                    throw e.InnerException;
                }
            }

            using (Page page = engine.Process(pix))
            {
                return page.GetText();
            }
        }
    }
}

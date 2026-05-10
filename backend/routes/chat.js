const express = require('express');
const axios = require('axios');
const config = require('../config');
const snowClient = require('../services/snowClient');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const GEMINI_API_KEY = config.geminiKey;

function generateSmartReply(msg, projectCtx) {
    // ── ENTERPRISE APP NAVIGATION ──
    if (/\b(hi|hello|hey|greetings)\b/.test(msg)) return 'Hello! I am your **Enterprise AI Assistant**. Ask me about **Projects**, **HR**, **Tasks**, **SLA**, **Science**, **Tech**, **History**, **GK**, or anything else!';
    if (msg.includes('task') || msg.includes('onboarding')) return 'Based on live ServiceNow data, check the **Employee Tasks** tab for details.';
    if (msg.includes('risk') || msg.includes('bottleneck') || msg.includes('delay')) return 'Check the **SLA Intelligence** tab for real-time AI bottleneck predictions.';
    if (msg.includes('sla')) return 'The **SLA Engine** monitors all sprint tasks. Check **My Performance** for your SLA success rate.';
    if (msg.includes('project')) return 'You can manage all projects in the **Project Delivery** tab. Add start date and deadline for each project.';
    if (msg.includes('hr') || msg.includes('employee') || msg.includes('hire')) return 'The **HR Dashboard** shows all employees. Use **New Hire** to register employees in ServiceNow.';
    if (msg.includes('menu') || msg.includes('food') || msg.includes('lunch')) return 'Check the **Daily Menu** tab for today\'s meal options.';
    if (msg.includes('issue') || msg.includes('ticket') || msg.includes('problem')) return 'Use the **Report Issue** tab to create support tickets in ServiceNow.';
    if (msg.includes('performance')) return 'Check **My Performance** for your SLA success rate and task completion metrics.';

    // ── SCIENCE & TECHNOLOGY ──
    if (msg.includes('quantum')) return '**Quantum computing** uses qubits that can exist in multiple states simultaneously, enabling massive parallel processing. Companies like IBM and Google are leading research.';
    if (msg.includes('black hole')) return 'A **black hole** is a region where gravity is so strong that nothing, not even light, can escape. The event horizon marks its boundary.';
    if (msg.includes('dna')) return '**DNA** (deoxyribonucleic acid) carries genetic instructions for development and functioning. It forms a double helix structure discovered by Watson and Crick in 1953.';
    if (msg.includes('photosynthesis')) return '**Photosynthesis** is how plants convert sunlight, CO₂, and water into glucose and oxygen. It occurs in chloroplasts using chlorophyll.';
    if (msg.includes('gravity')) return '**Gravity** is the force that attracts objects with mass. Newton discovered it; Einstein explained it as spacetime curvature in General Relativity.';
    if (msg.includes('atom')) return 'An **atom** is the smallest unit of matter, consisting of protons, neutrons (in nucleus), and electrons orbiting around it.';
    if (msg.includes('evolution')) return '**Evolution** is the process by which species change over generations through natural selection, genetic drift, and mutation. Proposed by Charles Darwin.';
    if (msg.includes('climate change') || msg.includes('global warming')) return '**Climate change** refers to long-term shifts in temperatures and weather patterns, mainly caused by human activities like burning fossil fuels.';
    if (msg.includes('solar system')) return 'Our **solar system** has 8 planets orbiting the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.';
    if (msg.includes('big bang')) return 'The **Big Bang** theory describes the universe\'s origin ~13.8 billion years ago from an extremely hot, dense singularity that expanded rapidly.';

    // ── MATHEMATICS ──
    if (msg.includes('pi')) return '**Pi (π)** is the ratio of a circle\'s circumference to its diameter, approximately **3.14159**. It is an irrational number.';
    if (msg.includes('pythagoras') || msg.includes('pythagorean')) return 'The **Pythagorean theorem** states that in a right triangle, a² + b² = c², where c is the hypotenuse.';
    if (msg.includes('fibonacci')) return 'The **Fibonacci sequence** (1, 1, 2, 3, 5, 8...) appears throughout nature in spiral patterns, flower petals, and tree branches.';
    if (msg.includes('prime number')) return 'A **prime number** is divisible only by 1 and itself. Examples: 2, 3, 5, 7, 11. They are fundamental to modern cryptography.';
    if (msg.includes('calculus')) return '**Calculus** studies continuous change through derivatives (rates of change) and integrals (accumulation). Developed by Newton and Leibniz.';

    // ── HISTORY & GEOGRAPHY ──
    if (msg.includes('world war 2') || msg.includes('ww2') || msg.includes('world war ii')) return '**World War II** (1939–1945) was the deadliest conflict in history. Allied powers defeated Axis powers, reshaping global politics and leading to the UN\'s formation.';
    if (msg.includes('world war 1') || msg.includes('ww1') || msg.includes('world war i')) return '**World War I** (1914–1918) began after Franz Ferdinand\'s assassination. It introduced tanks, chemical warfare, and ended with the Treaty of Versailles.';
    if (msg.includes('mahatma gandhi') || msg.includes('gandhi')) return '**Mahatma Gandhi** (1869–1948) led India\'s nonviolent independence movement against British rule through civil disobedience and peaceful protest.';
    if (msg.includes('adolf hitler') || msg.includes('hitler')) return '**Adolf Hitler** (1889–1945) was the Nazi dictator of Germany who initiated WWII and the Holocaust, responsible for millions of deaths.';
    if (msg.includes('indian independence') || msg.includes('independence of india')) return 'India gained **independence** on **15 August 1947** after nearly 200 years of British rule, led by Gandhi, Nehru, and the Indian National Congress.';
    if (msg.includes('cold war')) return 'The **Cold War** (1947–1991) was a geopolitical rivalry between the USA and USSR, characterized by proxy wars, nuclear arms race, and space race.';
    if (msg.includes('renaissance')) return 'The **Renaissance** (14th–17th century) was a cultural rebirth in Europe emphasizing art, science, and humanism. Key figures: Leonardo da Vinci, Michelangelo.';
    if (msg.includes('industrial revolution')) return 'The **Industrial Revolution** (1760–1840) transformed manufacturing with steam power, factories, and mechanization, starting in Britain.';
    if (msg.includes('french revolution')) return 'The **French Revolution** (1789–1799) overthrew the monarchy, establishing republicanism and influencing democratic movements worldwide.';
    if (msg.includes('berlin wall')) return 'The **Berlin Wall** (1961–1989) divided East and West Berlin during the Cold War. Its fall symbolized the end of communist Eastern Europe.';
    if (msg.includes('mount everest')) return '**Mount Everest** is Earth\'s highest peak at **8,849 meters**, located in the Himalayas on the Nepal-Tibet border.';
    if (msg.includes('amazon river') || msg.includes('amazon rainforest')) return 'The **Amazon River** is the world\'s largest by volume. The **Amazon Rainforest** produces ~20% of Earth\'s oxygen and hosts incredible biodiversity.';
    if (msg.includes('sahara')) return 'The **Sahara Desert** is the world\'s largest hot desert, covering ~9 million km² across North Africa.';
    if (msg.includes('pacific ocean')) return 'The **Pacific Ocean** is the largest and deepest ocean, covering ~63 million mi² — larger than all land combined.';

    // ── COMPUTER SCIENCE & IT ──
    if (msg.includes('servicenow') || msg.includes('service now')) return '**ServiceNow** is a cloud-based platform for IT service management, workflow automation, and enterprise operations. This app integrates with ServiceNow PDI.';
    if (msg.includes('node.js') || msg.includes('nodejs')) return '**Node.js** is a JavaScript runtime built on Chrome\'s V8 engine, enabling server-side JavaScript execution with high performance.';
    if (msg.includes('react')) return '**React** is a JavaScript library for building user interfaces using reusable components and a virtual DOM for efficient rendering.';
    if (msg.includes('api')) return 'An **API** (Application Programming Interface) allows software applications to communicate. REST APIs use HTTP methods: GET, POST, PUT, DELETE.';
    if (msg.includes('database') || msg.includes('sql')) return 'A **database** organizes structured data. **SQL** databases (MySQL, PostgreSQL) use tables; **NoSQL** (MongoDB) uses documents.';
    if (msg.includes('cloud computing')) return '**Cloud computing** delivers on-demand computing services (servers, storage, databases) over the internet. Major providers: AWS, Azure, Google Cloud.';
    if (msg.includes('artificial intelligence') || msg.includes('machine learning')) return '**AI** simulates human intelligence. **Machine Learning** is a subset where systems learn from data without explicit programming.';
    if (msg.includes('cybersecurity')) return '**Cybersecurity** protects systems from digital attacks. Key areas: network security, encryption, penetration testing, and threat detection.';
    if (msg.includes('blockchain')) return '**Blockchain** is a decentralized digital ledger. Each block contains transactions linked cryptographically. Famous use: Bitcoin and cryptocurrency.';
    if (msg.includes('docker')) return '**Docker** containerizes applications so they run consistently across environments. A container includes code, runtime, libraries, and settings.';

    // ── BUSINESS & ECONOMICS ──
    if (msg.includes('stock market')) return 'The **stock market** is where shares of publicly traded companies are bought and sold. Major indices: S&P 500, Dow Jones, NASDAQ, Nifty 50.';
    if (msg.includes('inflation')) return '**Inflation** is the rate at which prices rise over time, reducing purchasing power. Central banks use interest rates to control it.';
    if (msg.includes('gdp')) return '**GDP** (Gross Domestic Product) measures a country\'s total economic output. It indicates economic health and growth rate.';
    if (msg.includes('supply and demand')) return '**Supply and demand** is an economic model where prices are determined by product availability (supply) and consumer desire (demand).';
    if (msg.includes('cryptocurrency') || msg.includes('bitcoin')) return '**Bitcoin** is the first decentralized cryptocurrency, created in 2009 by Satoshi Nakamoto. It uses blockchain for secure peer-to-peer transactions.';
    if (msg.includes('startup')) return 'A **startup** is a young company developing innovative products/scalable business models. They typically seek venture capital funding for growth.';
    if (msg.includes('marketing')) return '**Marketing** involves promoting products/services to target audiences. Key strategies: digital marketing, content marketing, SEO, and social media.';

    // ── SPORTS ──
    if (msg.includes('cricket')) return '**Cricket** is the world\'s second most popular sport. The ICC World Cup is its biggest tournament. India, Australia, and England are dominant teams.';
    if (msg.includes('football') || msg.includes('soccer')) return '**Football (soccer)** is the world\'s most popular sport. FIFA World Cup is held every 4 years. Brazil has won the most titles (5).';
    if (msg.includes('olympics')) return 'The **Olympic Games** occur every 4 years, featuring summer and winter sports. The ancient Olympics began in Greece in 776 BC.';
    if (msg.includes('tennis')) return '**Tennis** Grand Slams: Australian Open, French Open, Wimbledon, and US Open. Players like Federer, Nadal, and Djokovic have dominated the sport.';

    // ── HEALTH & LIFESTYLE ──
    if (msg.includes('meditation')) return '**Meditation** is a practice focusing the mind for mental clarity and emotional calm. Benefits: reduced stress, improved concentration, better sleep.';
    if (msg.includes('vitamin')) return '**Vitamins** are essential organic compounds needed in small amounts. Vitamin C boosts immunity; Vitamin D strengthens bones; B vitamins aid energy.';
    if (msg.includes('exercise')) return 'Regular **exercise** improves cardiovascular health, strengthens muscles, boosts mood through endorphins, and reduces chronic disease risk.';
    if (msg.includes('sleep')) return 'Adults need **7–9 hours** of sleep. Quality sleep improves memory, immune function, mood regulation, and overall physical health.';
    if (msg.includes('hydration') || msg.includes('water')) return 'Water makes up ~60% of the human body. Proper **hydration** supports digestion, temperature regulation, joint lubrication, and nutrient transport.';

    // ── GENERAL KNOWLEDGE ──
    if (msg.includes('taj mahal')) return 'The **Taj Mahal** is a white marble mausoleum in Agra, India, built by Mughal Emperor Shah Jahan in memory of his wife Mumtaz Mahal (1632–1653).';
    if (msg.includes('eiffel tower')) return 'The **Eiffel Tower** in Paris was built in 1889 by Gustave Eiffel. It is 330 meters tall and one of the world\'s most recognizable landmarks.';
    if (msg.includes('great wall')) return 'The **Great Wall of China** stretches ~21,000 km. Built over centuries to protect against invasions, it is visible from space.';
    if (msg.includes('statue of liberty')) return 'The **Statue of Liberty** was a gift from France to the USA in 1886. It symbolizes freedom and democracy, standing 93 meters tall in New York Harbor.';
    if (msg.includes('who is the president') || msg.includes('current president')) return 'As of 2026, **Donald Trump** is serving as the 47th President of the United States.';
    if (msg.includes('largest country')) return '**Russia** is the world\'s largest country by area (~17 million km²). **Vatican City** is the smallest.';
    if (msg.includes('population')) return 'The world population reached **~8 billion** in 2022. **India** is now the most populous country, followed by China.';
    if (msg.includes('language')) return '**Mandarin Chinese** has the most native speakers. **English** is the most widely spoken language globally, including non-native speakers.';
    if (msg.includes('currency')) return 'The **US Dollar (USD)** is the world\'s primary reserve currency. The **Euro (EUR)** is used by 20 EU countries.';
    if (msg.includes('time zone')) return 'Earth is divided into **24 time zones**. **UTC (Coordinated Universal Time)** is the primary standard. India uses IST (UTC+5:30).';
    if (msg.includes('speed of light')) return 'The **speed of light** in a vacuum is **299,792,458 m/s** (~300,000 km/s). Nothing can travel faster.';
    if (msg.includes('nobel prize')) return 'The **Nobel Prize** is awarded annually for achievements in Physics, Chemistry, Medicine, Literature, Peace, and Economic Sciences.';
    if (msg.includes('united nations') || msg.includes('un ')) return 'The **United Nations (UN)** was founded in 1945 to promote peace and cooperation. It has 193 member states.';
    if (/\bwho\b/.test(msg) && (msg.includes('health') || msg.includes('organization') || msg.includes('world health'))) return 'The **WHO (World Health Organization)** is the UN agency responsible for international public health, founded in 1948.';

    // ── SPACE & ASTRONOMY ──
    if (msg.includes('mars')) return '**Mars** is the fourth planet from the Sun, known as the Red Planet due to iron oxide on its surface. NASA and SpaceX aim for human missions.';
    if (msg.includes('moon')) return 'The **Moon** is Earth\'s only natural satellite, ~384,400 km away. It influences tides and stabilizes Earth\'s axial tilt.';
    if (msg.includes('sun')) return 'The **Sun** is a G-type main-sequence star at the solar system\'s center. It provides 99.86% of the system\'s mass and all Earth\'s energy.';
    if (msg.includes('iss') || msg.includes('international space station')) return 'The **ISS** is a habitable artificial satellite orbiting Earth. It has been continuously occupied since November 2000.';
    if (msg.includes('spacex') || msg.includes('elon musk')) return '**SpaceX**, founded by **Elon Musk** in 2002, revolutionized space travel with reusable rockets (Falcon 9, Starship).';
    if (msg.includes('nasa')) return '**NASA** (National Aeronautics and Space Administration) is the US space agency, established in 1958. It landed humans on the Moon in 1969.';

    // ── PHILOSOPHY & PSYCHOLOGY ──
    if (msg.includes('stoicism')) return '**Stoicism** teaches virtue, self-control, and resilience. Key Stoics: Marcus Aurelius, Seneca, Epictetus. Focus on what you can control.';
    if (msg.includes('freud') || msg.includes('sigmund')) return '**Sigmund Freud** founded psychoanalysis, introducing concepts like the id, ego, superego, and the unconscious mind.';
    if (msg.includes('maslow')) return '**Maslow\'s Hierarchy of Needs** describes human motivation: physiological → safety → love/belonging → esteem → self-actualization.';

    // ── NATURE & ENVIRONMENT ──
    if (msg.includes('ocean')) return 'Oceans cover **71%** of Earth\'s surface and produce ~50% of the world\'s oxygen through phytoplankton photosynthesis.';
    if (msg.includes('deforestation')) return '**Deforestation** destroys ~10 million hectares of forest annually. It drives climate change, biodiversity loss, and habitat destruction.';
    if (msg.includes('renewable energy')) return '**Renewable energy** comes from solar, wind, hydro, and geothermal sources. It reduces carbon emissions and combats climate change.';

    // ── FAMOUS PEOPLE ──
    if (msg.includes('apj') || msg.includes('abdul kalam') || msg.includes('kalam')) return '**APJ Abdul Kalam** (1931–2015) was the 11th President of India and a renowned aerospace scientist. He played a key role in India\'s missile and nuclear programs, earning the nickname "Missile Man of India."';
    if (msg.includes('albert einstein') || msg.includes('einstein')) return '**Albert Einstein** (1879–1955) was a theoretical physicist who developed the theory of relativity (E=mc²). He won the 1921 Nobel Prize in Physics and is considered one of the greatest scientists ever.';
    if (msg.includes('newton') || msg.includes('isaac newton')) return '**Isaac Newton** (1643–1727) was an English mathematician and physicist who formulated the laws of motion and universal gravitation. He also co-invented calculus.';
    if (msg.includes('steve jobs')) return '**Steve Jobs** (1955–2011) co-founded Apple Inc. He revolutionized personal computing, smartphones (iPhone), and digital animation (Pixar).';
    if (msg.includes('elon musk')) return '**Elon Musk** is the CEO of Tesla and SpaceX. He is pioneering electric vehicles, reusable rockets, and has acquired Twitter (now X).';
    if (msg.includes('bill gates')) return '**Bill Gates** co-founded Microsoft and later became one of the world\'s largest philanthropists through the Bill & Melinda Gates Foundation.';
    if (msg.includes('mark zuckerberg')) return '**Mark Zuckerberg** co-founded Facebook (now Meta) in 2004. He is driving the development of the metaverse and AI technologies.';
    if (msg.includes('sundar pichai')) return '**Sundar Pichai** is the CEO of Google and Alphabet. He led the development of Chrome and Android before becoming CEO in 2015.';
    if (msg.includes('satya nadella')) return '**Satya Nadella** is the CEO of Microsoft since 2014. He transformed Microsoft into a cloud-first company with Azure and Office 365.';
    if (msg.includes('ratan tata')) return '**Ratan Tata** is an Indian industrialist and former chairman of Tata Sons. He is renowned for his philanthropy and ethical leadership.';
    if (msg.includes('mukesh ambani')) return '**Mukesh Ambani** is the chairman of Reliance Industries, India\'s largest company. He led the Jio telecom revolution in India.';
    if (msg.includes('narendra modi')) return '**Narendra Modi** is the Prime Minister of India since 2014. He previously served as Chief Minister of Gujarat from 2001 to 2014.';
    if (msg.includes('barack obama')) return '**Barack Obama** served as the 44th US President (2009–2017). He was the first African-American president and implemented healthcare reform (Obamacare).';
    if (msg.includes('pawan kalyan')) return '**Pawan Kalyan** is an Indian actor, politician, and founder of the Jana Sena Party. He is a major star in Telugu cinema and currently serves as the Deputy Chief Minister of Andhra Pradesh.';
    if (msg.includes('mahesh babu')) return '**Mahesh Babu** is one of the biggest stars in Telugu cinema, known for films like *Pokiri*, *Srimanthudu*, and *Bharat Ane Nenu*.';
    if (msg.includes('allu arjun')) return '**Allu Arjun** is an Indian actor known as the "Stylish Star" of Telugu cinema. He won a National Award for *Pushpa* (2021).';
    if (msg.includes('prabhas')) return '**Prabhas** is an Indian actor who gained pan-India fame with the *Baahubali* series. He is one of the highest-paid actors in Indian cinema.';
    if (msg.includes('ntr') || msg.includes('n.t. rama rao')) return '**N.T. Rama Rao Jr.** (Jr. NTR) is a leading Telugu actor and dancer, known for *RRR*, *Simhadri*, and *Janatha Garage*.';
    if (msg.includes('ram charan')) return '**Ram Charan** is a Telugu actor and producer, famous for *Magadheera*, *Rangasthalam*, and the Oscar-winning film *RRR*.';
    if (msg.includes('chiranjeevi')) return '**Chiranjeevi** is a legendary Telugu actor and politician, known as the "Megastar" of Indian cinema. He has acted in over 150 films.';
    if (msg.includes('rajini') || msg.includes('rajinikanth')) return '**Rajinikanth** is a legendary Indian actor known as the "Superstar" of Tamil cinema. His style and dialogues have a massive fan following across India.';
    if (msg.includes('kamal haasan')) return '**Kamal Haasan** is a versatile Indian actor, director, and politician. He has won 4 National Awards and is known for films like *Nayakan* and *Indian*.';
    if (msg.includes('vijay') || msg.includes('thalapathy')) return '**Thalapathy Vijay** is one of the biggest stars in Tamil cinema, known for mass-action films and a huge fan base across South India.';
    if (msg.includes('shah rukh') || msg.includes('srk')) return '**Shah Rukh Khan** (SRK) is known as the "King of Bollywood." He is one of the most successful actors in Indian cinema with a global fan following.';
    if (msg.includes('salman khan')) return '**Salman Khan** is one of Bollywood\'s biggest stars, known for films like *Bajrangi Bhaijaan*, *Sultan*, and *Tiger* series. He also runs the charity Being Human.';
    if (msg.includes('amir khan')) return '**Aamir Khan** is a perfectionist Bollywood actor known for socially relevant films like *Lagaan*, *Taare Zameen Par*, *3 Idiots*, and *Dangal*.';
    if (msg.includes('amitabh bachchan')) return '**Amitabh Bachchan** is a Bollywood legend known as the "Shahenshah." He has acted in over 200 films and is still active in cinema and TV.';
    if (msg.includes('virat kohli')) return '**Virat Kohli** is an Indian cricketer and one of the greatest batsmen of all time. He has scored the most ODI centuries and leads India in many ICC records.';
    if (msg.includes('rohit sharma')) return '**Rohit Sharma** is the captain of the Indian cricket team and one of the most elegant opening batsmen, known for his record 5 ODI double centuries.';
    if (msg.includes('ms dhoni')) return '**MS Dhoni** is a legendary Indian cricketer who led India to victories in the 2007 T20 World Cup, 2011 ODI World Cup, and 2013 Champions Trophy.';
    if (msg.includes('sachin tendulkar')) return '**Sachin Tendulkar** is known as the "God of Cricket." He is the highest run-scorer in both Test and ODI cricket with 100 international centuries.';

    // ── DEFAULT (no match) ──
    return null;
}

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const userMessage = req.body.message;

        let projectContext = '';
        try {
            const [taskRes, sprintRes] = await Promise.all([
                snowClient.get(`/${config.snowScope}_onboarding_task?sysparm_display_value=all`),
                snowClient.get(`/${config.snowScope}_project_sprint_task?sysparm_display_value=all`)
            ]);
            const onboardingTasks = taskRes.data.result || [];
            const sprintTasks = sprintRes.data.result || [];
            const pending = onboardingTasks.filter(t => t.status !== 'Completed').length;
            const highRisk = sprintTasks.filter(t => {
                const risk = (t.delay_risk && (t.delay_risk.display_value || t.delay_risk)) || '';
                return risk === 'High';
            }).length;
            projectContext = `Current live data from ServiceNow PDI:\n- Total onboarding tasks: ${onboardingTasks.length}\n- Pending onboarding tasks: ${pending}\n- Total sprint tasks: ${sprintTasks.length}\n- High risk (bottleneck) sprint tasks: ${highRisk}`;
        } catch (e) {
            projectContext = 'Live ServiceNow data is currently unavailable.';
        }

        const systemPrompt = `You are an intelligent AI Assistant for the "Enterprise Employee Workflow & Delivery Intelligence Hub" - a full-stack enterprise application.

You have deep knowledge about:
1. **This Project**: A Node.js + ServiceNow integration that manages employee onboarding, sprint tasks, SLA monitoring, and AI bottleneck prediction.
2. **ServiceNow**: App Engine Studio, Business Rules, Flow Designer, SLA Definitions, tables, REST APIs.
3. **Tech Stack**: Node.js, Express.js, HTML/CSS, Vanilla JavaScript, Chart.js, Axios, ServiceNow PDI.
4. **Features**: HR Dashboard, Employee Tasks, Project Delivery, SLA Intelligence, My Performance, Priority Matrix, Daily Menu.

${projectContext}

Answer helpfully and concisely. For project-related questions, reference the live data above. For general tech/IT questions, answer from your training knowledge. Keep responses under 150 words unless asked for detail. Use **bold** for key terms.`;

        const msg = userMessage.toLowerCase();
        const fallbackReply = generateSmartReply(msg, projectContext);

        // If we have a fallback answer, return it instantly (no API call needed)
        if (fallbackReply) {
            return res.json({ reply: fallbackReply });
        }

        // No fallback match — try Gemini AI for unknown questions
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            return res.json({ reply: 'I am your **Enterprise AI Assistant**. Ask me about **HR**, **Projects**, **Tasks**, **SLA**, or general topics like **science**, **history**, **tech**, **sports**, and **business**!' });
        }

        let reply;
        try {
            const geminiRes = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    contents: [{
                        parts: [{ text: systemPrompt + '\n\nUser: ' + userMessage }]
                    }]
                },
                { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
            );
            reply = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response. Please try again.';
        } catch (geminiErr) {
            console.log('Gemini error:', geminiErr.response?.status || geminiErr.message);
            reply = 'I am your **Enterprise AI Assistant**. Ask me about **HR**, **Projects**, **Tasks**, **SLA**, or general topics like **science**, **history**, **tech**, **sports**, and **business**!';
        }
        res.json({ reply });
    } catch (err) {
        res.json({ reply: 'I am your Enterprise AI Assistant. How can I help you today?' });
    }
});

module.exports = router;

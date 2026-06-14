from sqlalchemy.orm import Session
from app.models import models
from app.core.database import SessionLocal, engine

def init_db():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(models.Intent).count() >= 15:
        db.close()
        return

    # ── Intents ──────────────────────────────────────────────────────
    intents_data = [
        ('Tea Shop', 'Opening a new tea shop or small restaurant', ['tea shop', 'cafe', 'restaurant', 'canteen', 'tiffin']),
        ('Birth Certificate', 'Applying for a new birth certificate', ['birth certificate', 'baby', 'newborn', 'janma']),
        ('Farm Subsidy', 'Applying for government agricultural subsidies', ['farm', 'subsidy', 'agriculture', 'farmer', 'crop']),
        ('Marriage Registration', 'Registering a marriage with the government', ['marriage', 'wedding', 'married', 'nikah']),
        ('Property Registration', 'Registering sale or purchase of property', ['property', 'land', 'house', 'registration', 'plot']),
        ('MSME Registration', 'Registering a small or medium business (Udyam)', ['business', 'msme', 'udyam', 'company', 'enterprise']),
        ('Caste Certificate', 'Applying for a community/caste certificate', ['caste', 'sc', 'st', 'bc', 'certificate', 'community']),
        ('Income Certificate', 'Applying for an official income certificate', ['income', 'salary', 'e-seva', 'certificate']),
        ('Driving License', 'Applying for a new learner or permanent driving license', ['driving', 'license', 'dl', 'rto', 'vehicle']),
        ('Voter ID Update', 'Updating details or applying for a new Voter ID card', ['voter', 'election', 'voter id', 'vote', 'epic']),
        ('PAN Card', 'Applying for a new PAN card or corrections', ['pan', 'pan card', 'income tax', 'permanent account']),
        ('Passport', 'New passport application or renewal', ['passport', 'travel', 'abroad', 'renewal']),
        ('Trade License', 'Obtaining municipal trade license for commercial activity', ['trade license', 'shop license', 'commercial license']),
        ('Pollution Certificate', 'Pollution control board NOC for businesses', ['pollution', 'pollution certificate', 'noc', 'environment']),
        ('Fire NOC', 'Fire department NOC for buildings and businesses', ['fire', 'fire noc', 'fire safety', 'fire department']),
        ('Building Plan Approval', 'Municipal construction plan approval', ['building plan', 'construction', 'building approval', 'floor plan']),
        ('Ration Card', 'New ration card or transfer of existing card', ['ration card', 'ration', 'food grains', 'pds']),
        ('Senior Citizen Certificate', 'Senior citizen certificate for benefits and concessions', ['senior citizen', 'elderly', 'old age', 'pension']),
        ('Student Scholarship', 'Applying for student scholarships and education benefits', ['scholarship', 'student', 'education', 'study', 'tuition', 'fellowship']),
        ('Food Truck Restaurant', 'Starting a food truck, restaurant, hotel, or mess', ['food truck', 'restaurant', 'hotel', 'mess', 'dhaba', 'eatery']),
    ]

    intents = {}
    for name, desc, keywords in intents_data:
        existing = db.query(models.Intent).filter(models.Intent.name == name).first()
        if not existing:
            intent = models.Intent(name=name, description=desc, trigger_keywords=keywords)
            db.add(intent)
            db.flush()
            intents[name] = intent
        else:
            intents[name] = existing

    db.commit()

    # ── Roadmap Templates (10 comprehensive citizen goal roadmaps) ──
    roadmap_templates = {
        'Tea Shop': {
            'title': 'Tea Shop / Small Restaurant Roadmap',
            'timeline': '15-30',
            'fastestPath': 'Upload Aadhaar, PAN, rental agreement, and shop address proof first, then start Shop & Establishment registration.',
            'teluguHint': 'ముందుగా ఆధార్, పాన్, రెంటల్ అగ్రిమెంట్ అప్లోడ్ చేసి షాప్ రిజిస్ట్రేషన్ ప్రారంభించండి.',
            'schemes': ['PM SVANidhi', 'MUDRA Shishu Loan', 'Telangana T-PRIDE'],
            'steps': [
                {'id': 1, 'title': 'Shop & Establishment Registration', 'dept': 'Telangana Labour Department', 'status': 'Ready', 'days': '2-4 days', 'documents': ['Aadhaar', 'PAN', 'Shop address proof', 'Passport photos']},
                {'id': 2, 'title': 'GHMC Trade License', 'dept': 'Greater Hyderabad Municipal Corporation', 'status': 'Blocked by Step 1', 'days': '5-7 days', 'documents': ['Rental agreement', 'Photos', 'NOC if applicable', 'Aadhaar']},
                {'id': 3, 'title': 'FSSAI Basic Registration', 'dept': 'Food Safety and Standards Authority', 'status': 'Pending', 'days': '7-10 days', 'documents': ['Food business details', 'ID proof', 'Applicant photo', 'Layout plan']},
                {'id': 4, 'title': 'GST Registration', 'dept': 'Commercial Taxes / GSTN', 'status': 'Optional', 'days': '1-3 days', 'documents': ['PAN', 'Bank details', 'Business address proof']},
                {'id': 5, 'title': 'Open Business Bank Account', 'dept': 'Banks', 'status': 'Pending', 'days': '3-7 days', 'documents': ['Aadhaar', 'PAN', 'Business registration proof', 'Address proof']},
                {'id': 6, 'title': 'Start Operations', 'dept': 'Self', 'status': 'Pending', 'days': '1 day', 'documents': ['All registered licenses', 'Staff Aadhaar details']},
            ]
        },
        'MSME Registration': {
            'title': 'Register a Small Business (MSME) Roadmap',
            'timeline': '10-20',
            'fastestPath': 'Start Udyam registration online at udyam.gov.in with Aadhaar and PAN.',
            'teluguHint': 'ఉద్యోగ్ పోర్టల్ లో ఆధార్ మరియు పాన్ ఉపయోగించి ఉద్యమ్ రిజిస్ట్రేషన్ ప్రారంభించండి.',
            'schemes': ['MUDRA Shishu Loan', 'MUDRA Kishore Loan', 'Udyog Aadhaar', 'Startup India Seed Fund'],
            'steps': [
                {'id': 1, 'title': 'UDYAM Registration', 'dept': 'Ministry of MSME', 'status': 'Ready', 'days': '1 day', 'documents': ['Aadhaar', 'PAN', 'Business address proof', 'Bank details']},
                {'id': 2, 'title': 'GST Registration', 'dept': 'CBIC / GSTN', 'status': 'Pending', 'days': '3-7 days', 'documents': ['PAN', 'Business address proof', 'Bank details', 'Photos']},
                {'id': 3, 'title': 'Open Business Bank Account', 'dept': 'Banks', 'status': 'Pending', 'days': '3-7 days', 'documents': ['Aadhaar', 'PAN', 'Udyam certificate', 'Business address proof']},
                {'id': 4, 'title': 'Trade License', 'dept': 'GHMC / Municipality', 'status': 'Optional', 'days': '7-15 days', 'documents': ['Rental agreement', 'Aadhaar', 'Photos', 'NOC if applicable']},
            ]
        },
        'Birth Certificate': {
            'title': 'Birth Certificate Application Roadmap',
            'timeline': '7-21',
            'fastestPath': 'Keep hospital discharge summary and parent Aadhaar ready before visiting the municipal counter or MeeSeva portal.',
            'teluguHint': 'ముందుగా హాస్పిటల్ డిశ్చార్జ్ సమరీ మరియు తల్లిదండ్రుల ఆధార్ సిద్ధం చేయండి.',
            'schemes': ['Newborn health registration guidance', 'MeeSeva certificate support'],
            'steps': [
                {'id': 1, 'title': 'Hospital Birth Record Verification', 'dept': 'Hospital / Health Department', 'status': 'Ready', 'days': '1-2 days', 'documents': ['Hospital discharge summary', 'Parent Aadhaar', 'Birth report from hospital']},
                {'id': 2, 'title': 'Collect Supporting Documents', 'dept': 'Self', 'status': 'Pending', 'days': '1-2 days', 'documents': ['Parent Aadhaar', 'Address proof', 'Marriage certificate of parents', 'Passport photos']},
                {'id': 3, 'title': 'Apply via MeeSeva / Municipality', 'dept': 'GHMC / Municipality / MeeSeva', 'status': 'Pending', 'days': '5-14 days', 'documents': ['Form 1', 'Hospital record', 'Parent ID proof', 'Address proof']},
                {'id': 4, 'title': 'Verification by Authority', 'dept': 'Municipality', 'status': 'Pending', 'days': '7-14 days', 'documents': ['Application acknowledgement']},
                {'id': 5, 'title': 'Birth Certificate Issued', 'dept': 'MeeSeva / Municipality', 'status': 'Pending', 'days': '1-3 days', 'documents': ['Application receipt', 'Aadhaar']},
            ]
        },
        'Marriage Registration': {
            'title': 'Marriage Certificate Registration Roadmap',
            'timeline': '15-30',
            'fastestPath': 'Collect age proofs, address proofs, wedding photos, and witness IDs before booking a Sub-Registrar appointment.',
            'teluguHint': 'సాక్షుల ఐడీలు మరియు వివాహ ఫోటోలు ముందుగానే సిద్ధం చేయండి.',
            'schemes': ['Kalyana Lakshmi', 'Shaadi Mubarak', 'MeeSeva registration assistance'],
            'steps': [
                {'id': 1, 'title': 'Gather Documents', 'dept': 'Self', 'status': 'Ready', 'days': '1-3 days', 'documents': ['Aadhaar of Bride', 'Aadhaar of Groom', 'Age proof (Birth certificate / SSLC)', 'Address proof']},
                {'id': 2, 'title': 'Wedding Photos & Affidavit', 'dept': 'Notary / Legal', 'status': 'Pending', 'days': '1-2 days', 'documents': ['Wedding photos', 'Affidavit from both parties', 'Passport photos']},
                {'id': 3, 'title': 'Book Registration Appointment', 'dept': 'Sub-Registrar Office', 'status': 'Pending', 'days': '1-3 days', 'documents': ['Online appointment receipt', 'All gathered documents']},
                {'id': 4, 'title': 'Visit Sub-Registrar Office', 'dept': 'Sub-Registrar Office', 'status': 'Pending', 'days': '1 day', 'documents': ['Witness IDs (2 witnesses)', 'Invitation card', 'Marriage proof']},
                {'id': 5, 'title': 'Marriage Certificate Issued', 'dept': 'Sub-Registrar Office', 'status': 'Pending', 'days': '7-15 days', 'documents': ['Application receipt', 'Aadhaar']},
            ]
        },
        'Property Registration': {
            'title': 'Property Registration Roadmap',
            'timeline': '15-30',
            'fastestPath': 'Complete legal verification and stamp duty payment before visiting the Sub-Registrar for deed registration.',
            'teluguHint': 'స్టాంప్ డ్యూటీ చెల్లింపు మరియు లీగల్ వెరిఫికేషన్ ముందుగా పూర్తి చేయండి.',
            'schemes': ['PM Awas Yojana', 'Pradhan Mantri Awas Yojana'],
            'steps': [
                {'id': 1, 'title': 'Legal Verification', 'dept': 'Legal / Advocate', 'status': 'Ready', 'days': '3-7 days', 'documents': ['Property documents', 'Title deed', 'Survey/encumbrance certificate', 'Aadhaar', 'PAN']},
                {'id': 2, 'title': 'Stamp Duty Payment', 'dept': 'Sub-Registrar / IGR', 'status': 'Pending', 'days': '1-2 days', 'documents': ['Sale agreement', 'Property valuation report', 'PAN', 'Bank challan']},
                {'id': 3, 'title': 'Prepare Sale Deed', 'dept': 'Advocate / Legal', 'status': 'Pending', 'days': '2-5 days', 'documents': ['Stamp duty receipt', 'Property documents', 'ID proofs of both parties']},
                {'id': 4, 'title': 'Sub-Registrar Appointment', 'dept': 'Sub-Registrar Office', 'status': 'Pending', 'days': '1-3 days', 'documents': ['Online appointment receipt', 'Sale deed', 'Photos', 'Witness IDs']},
                {'id': 5, 'title': 'Registration Complete', 'dept': 'Sub-Registrar Office', 'status': 'Pending', 'days': '7-15 days', 'documents': ['Registration receipt', 'Registered sale deed', 'Aadhaar']},
            ]
        },
        'Driving License': {
            'title': 'Driving License Application Roadmap',
            'timeline': '15-45',
            'fastestPath': 'Apply for learner license first, practice driving, then book permanent DL test.',
            'teluguHint': 'ముందుగా లెర్నర్ లైసెన్స్ కోసం దరఖాస్తు చేసి, డ్రైవింగ్ అభ్యసించండి.',
            'schemes': ['Skill India Certification'],
            'steps': [
                {'id': 1, 'title': 'Apply for Learner License', 'dept': 'RTO / Transport Department', 'status': 'Ready', 'days': '1-3 days', 'documents': ['Aadhaar', 'Address proof', 'Passport photos', 'Medical certificate (Form 1A)', 'Age proof']},
                {'id': 2, 'title': 'Pass Learner Test', 'dept': 'RTO', 'status': 'Pending', 'days': '1-7 days', 'documents': ['Learner application receipt', 'ID proof']},
                {'id': 3, 'title': 'Practice Driving', 'dept': 'Self', 'status': 'Pending', 'days': '15-30 days', 'documents': ['Learner license', 'Vehicle documents']},
                {'id': 4, 'title': 'Book Driving Test', 'dept': 'RTO / Transport Department', 'status': 'Pending', 'days': '1-3 days', 'documents': ['Learner license', 'Vehicle for test', 'Application fee receipt']},
                {'id': 5, 'title': 'Pass Driving Test', 'dept': 'RTO', 'status': 'Pending', 'days': '1 day', 'documents': ['Vehicle', 'Learner license']},
                {'id': 6, 'title': 'Driving License Issued', 'dept': 'RTO / Transport Department', 'status': 'Pending', 'days': '7-15 days', 'documents': ['Test pass receipt', 'Aadhaar']},
            ]
        },
        'Farm Subsidy': {
            'title': 'Farmer Welfare Schemes Roadmap',
            'timeline': '10-30',
            'fastestPath': 'Verify land ownership records and Aadhaar-bank linkage before applying for farmer schemes.',
            'teluguHint': 'ముందుగా భూమి పత్రాలు మరియు బ్యాంక్ లింక్ అయిన ఆధార్ సిద్ధం చేయండి.',
            'schemes': ['Rythu Bandhu', 'PM-KISAN', 'Rythu Bima', 'Crop insurance'],
            'steps': [
                {'id': 1, 'title': 'Farmer Registration', 'dept': 'Agriculture Department', 'status': 'Ready', 'days': '1-3 days', 'documents': ['Aadhaar', 'Pattadar passbook', 'Bank passbook', 'Mobile number']},
                {'id': 2, 'title': 'Land Verification', 'dept': 'Revenue Department', 'status': 'Pending', 'days': '3-7 days', 'documents': ['Land records', 'Survey number', 'Pattadar passbook', 'Aadhaar']},
                {'id': 3, 'title': 'Scheme Eligibility Check', 'dept': 'Agriculture Department', 'status': 'Pending', 'days': '1-3 days', 'documents': ['Land record', 'Bank details', 'Aadhaar-bank link proof']},
                {'id': 4, 'title': 'Apply for Scheme', 'dept': 'Agriculture Department / MeeSeva', 'status': 'Pending', 'days': '3-7 days', 'documents': ['Application form', 'Land documents', 'Bank passbook', 'Aadhaar', 'Crop details']},
                {'id': 5, 'title': 'Verification', 'dept': 'Agriculture / Revenue Department', 'status': 'Pending', 'days': '7-15 days', 'documents': ['Application acknowledgement']},
                {'id': 6, 'title': 'Benefit Transfer', 'dept': 'Bank / Agriculture Department', 'status': 'Pending', 'days': '3-7 days', 'documents': ['Aadhaar-bank linked account']},
            ]
        },
        'Income Certificate': {
            'title': 'Income / Caste / Residence Certificate Roadmap',
            'timeline': '7-21',
            'fastestPath': 'Collect Aadhaar, address proof, and supporting certificates, then apply via MeeSeva.',
            'teluguHint': 'ఆధార్, చిరునామా రుజువు మరియు ఇతర ధృవీకరణ పత్రాలు సిద్ధం చేసి మీసేవా ద్వారా దరఖాస్తు చేయండి.',
            'schemes': ['Post Matric Scholarship', 'Ration Card - AAY', 'Ration Card - BPL', 'Ayushman Bharat'],
            'steps': [
                {'id': 1, 'title': 'Choose Certificate Type', 'dept': 'Self', 'status': 'Ready', 'days': '1 day', 'documents': ['Aadhaar', 'Understanding of certificate needed']},
                {'id': 2, 'title': 'Collect Documents', 'dept': 'Self', 'status': 'Pending', 'days': '1-3 days', 'documents': ['Aadhaar', 'Address proof', 'Supporting certificates', 'Salary slip or affidavit', 'Bank statements']},
                {'id': 3, 'title': 'MeeSeva Application', 'dept': 'MeeSeva / Revenue Department', 'status': 'Pending', 'days': '1-2 days', 'documents': ['Application form', 'Aadhaar', 'Supporting documents', 'Fee receipt']},
                {'id': 4, 'title': 'Verification', 'dept': 'MRO / Tahsildar Office', 'status': 'Pending', 'days': '5-14 days', 'documents': ['Application acknowledgement']},
                {'id': 5, 'title': 'Certificate Issued', 'dept': 'MeeSeva / Revenue Department', 'status': 'Pending', 'days': '1-3 days', 'documents': ['Application receipt', 'Aadhaar']},
            ]
        },
        'PAN Card': {
            'title': 'PAN Card Application Roadmap',
            'timeline': '10-20',
            'fastestPath': 'Apply online at NSDL/UTIITSL portal with Aadhaar and passport photos.',
            'teluguHint': 'NSDL/UTIITSL పోర్టల్ లో ఆధార్ మరియు ఫోటోలు ఉపయోగించి ఆన్‌లైన్‌లో దరఖాస్తు చేయండి.',
            'schemes': ['PM Jan Dhan Yojana'],
            'steps': [
                {'id': 1, 'title': 'Gather Documents', 'dept': 'Self', 'status': 'Ready', 'days': '1 day', 'documents': ['Aadhaar', 'Passport photos', 'Signature']},
                {'id': 2, 'title': 'PAN Application', 'dept': 'Income Tax Dept / NSDL / UTIITSL', 'status': 'Pending', 'days': '1-2 days', 'documents': ['Form 49A', 'Aadhaar', 'Photos', 'Signature', 'Fee payment']},
                {'id': 3, 'title': 'Processing & Verification', 'dept': 'NSDL / Income Tax', 'status': 'Pending', 'days': '7-15 days', 'documents': ['Application acknowledgement (ARN)']},
                {'id': 4, 'title': 'PAN Card Delivered', 'dept': 'India Post / NSDL', 'status': 'Pending', 'days': '2-5 days', 'documents': ['Aadhaar for delivery verification']},
            ]
        },
        'Passport': {
            'title': 'Passport Application Roadmap',
            'timeline': '20-45',
            'fastestPath': 'Apply online at Passport Seva portal, complete police verification, and attend appointment at Passport Seva Kendra.',
            'teluguHint': 'పాస్‌పోర్ట్ సేవా పోర్టల్ లో ఆన్‌లైన్‌లో దరఖాస్తు చేసి, పోలీస్ వెరిఫికేషన్ పూర్తి చేయండి.',
            'schemes': ['PM Jan Dhan Yojana'],
            'steps': [
                {'id': 1, 'title': 'Gather Documents', 'dept': 'Self', 'status': 'Ready', 'days': '1-2 days', 'documents': ['Aadhaar', 'PAN', 'Birth certificate', 'Address proof', 'Passport photos']},
                {'id': 2, 'title': 'Online Application', 'dept': 'Passport Seva / MEA', 'status': 'Pending', 'days': '1 day', 'documents': ['Form filling', 'Fee payment', 'Appointment booking']},
                {'id': 3, 'title': 'Photograph & Document Verification', 'dept': 'Passport Seva Kendra', 'status': 'Pending', 'days': '1 day', 'documents': ['All original documents', 'Appointment confirmation']},
                {'id': 4, 'title': 'Police Verification', 'dept': 'Police Department', 'status': 'Pending', 'days': '7-15 days', 'documents': ['Aadhaar', 'Address proof', 'Character certificate', 'Passport application receipt']},
                {'id': 5, 'title': 'Passport Issued', 'dept': 'MEA / Passport Seva', 'status': 'Pending', 'days': '7-15 days', 'documents': ['Application reference number', 'Aadhaar']},
            ]
        },
        'Ration Card': {
            'title': 'Ration Card Application Roadmap',
            'timeline': '15-30',
            'fastestPath': 'Collect income proof and address proof, then apply via MeeSeva or Civil Supplies office.',
            'teluguHint': 'ఆదాయం మరియు చిరునామా రుజువు సిద్ధం చేసి మీసేవా ద్వారా దరఖాస్తు చేయండి.',
            'schemes': ['Ration Card - AAY', 'Ration Card - PHH', 'Ration Card - BPL'],
            'steps': [
                {'id': 1, 'title': 'Income Verification', 'dept': 'MRO Office', 'status': 'Ready', 'days': '3-7 days', 'documents': ['Aadhaar', 'Income proof', 'Bank statements', 'Salary slip or affidavit']},
                {'id': 2, 'title': 'Collect Documents', 'dept': 'Self', 'status': 'Pending', 'days': '1-2 days', 'documents': ['Aadhaar (all family members)', 'Address proof', 'Income certificate', 'Family photo', 'Gas connection proof']},
                {'id': 3, 'title': 'Apply via MeeSeva', 'dept': 'Civil Supplies / MeeSeva', 'status': 'Pending', 'days': '1-2 days', 'documents': ['Application form', 'All documents', 'Fee receipt']},
                {'id': 4, 'title': 'Verification', 'dept': 'Civil Supplies Department', 'status': 'Pending', 'days': '7-15 days', 'documents': ['Application acknowledgement']},
                {'id': 5, 'title': 'Ration Card Issued', 'dept': 'Civil Supplies Department', 'status': 'Pending', 'days': '3-7 days', 'documents': ['Application receipt', 'Aadhaar']},
            ]
        },
        'Voter ID Update': {
            'title': 'Voter ID Application / Update Roadmap',
            'timeline': '15-30',
            'fastestPath': 'Fill Form 6 (new) or Form 8 (correction) online at voters.eci.gov.in or visit BLO.',
            'teluguHint': 'voters.eci.gov.in లో ఆన్‌లైన్‌లో ఫారం 6/8 పూరించండి లేదా BLO ని సంప్రదించండి.',
            'schemes': [],
            'steps': [
                {'id': 1, 'title': 'Gather Documents', 'dept': 'Self', 'status': 'Ready', 'days': '1 day', 'documents': ['Aadhaar', 'Address proof', 'Old voter ID (if updating)', 'Passport photos', 'Age proof']},
                {'id': 2, 'title': 'Submit Form 6 / Form 8', 'dept': 'Election Commission / BLO', 'status': 'Pending', 'days': '1-3 days', 'documents': ['Filled form', 'Supporting documents', 'Aadhaar']},
                {'id': 3, 'title': 'Verification by BLO', 'dept': 'Election Commission', 'status': 'Pending', 'days': '7-15 days', 'documents': ['Application acknowledgement']},
                {'id': 4, 'title': 'Voter ID Issued / Updated', 'dept': 'Election Commission', 'status': 'Pending', 'days': '7-15 days', 'documents': ['Application receipt']},
            ]
        },
        'Student Scholarship': {
            'title': 'Student Scholarship Application Roadmap',
            'timeline': '15-45',
            'fastestPath': 'Collect income certificate, bonafide certificate, and bank passbook, then apply via the scholarship portal.',
            'teluguHint': 'ఆదాయ ధృవీకరణ పత్రం, బొనాఫైడ్, బ్యాంక్ పాస్‌బుక్ సిద్ధం చేసి స్కాలర్‌షిప్ పోర్టల్ లో దరఖాస్తు చేయండి.',
            'schemes': ['Post Matric Scholarship', 'Central Sector Scholarship', 'Merit-cum-Means Scholarship'],
            'steps': [
                {'id': 1, 'title': 'Select Scholarship', 'dept': 'Self', 'status': 'Ready', 'days': '1-2 days', 'documents': ['Aadhaar', 'Income certificate', 'Bonafide certificate', 'Academic records']},
                {'id': 2, 'title': 'Check Eligibility', 'dept': 'Scholarship Portal', 'status': 'Pending', 'days': '1 day', 'documents': ['Academic records', 'Income proof', 'Category certificate (if applicable)']},
                {'id': 3, 'title': 'Collect Documents', 'dept': 'Self', 'status': 'Pending', 'days': '2-5 days', 'documents': ['Aadhaar', 'Income certificate', 'Bonafide certificate', 'Bank passbook', 'Passport photos', 'Previous year marksheet']},
                {'id': 4, 'title': 'Submit Application', 'dept': 'Scholarship Portal / College', 'status': 'Pending', 'days': '1-2 days', 'documents': ['Application form', 'All documents', 'Fee receipt']},
                {'id': 5, 'title': 'Verification', 'dept': 'College / Scholarship Department', 'status': 'Pending', 'days': '7-21 days', 'documents': ['Application acknowledgement']},
                {'id': 6, 'title': 'Scholarship Approval', 'dept': 'Scholarship Department / Bank', 'status': 'Pending', 'days': '7-15 days', 'documents': ['Aadhaar-bank linked account', 'Application reference number']},
            ]
        },
        'Food Truck Restaurant': {
            'title': 'Food Truck / Restaurant Business Roadmap',
            'timeline': '20-40',
            'fastestPath': 'Finalize business location, then apply for Trade License, FSSAI, and Fire NOC in sequence.',
            'teluguHint': 'వ్యాపార స్థలాన్ని ఖరారు చేసి, ట్రేడ్ లైసెన్స్, FSSAI, ఫైర్ NOC కోసం దరఖాస్తు చేయండి.',
            'schemes': ['PM SVANidhi', 'MUDRA Shishu Loan', 'MUDRA Kishore Loan', 'Telangana T-PRIDE'],
            'steps': [
                {'id': 1, 'title': 'Finalize Business Location', 'dept': 'Self', 'status': 'Ready', 'days': '1-5 days', 'documents': ['Aadhaar', 'PAN', 'Location details', 'Rental agreement or ownership proof']},
                {'id': 2, 'title': 'Trade License', 'dept': 'GHMC / Municipality', 'status': 'Pending', 'days': '7-15 days', 'documents': ['Rental agreement', 'Photos', 'NOC from neighbors', 'Aadhaar', 'PAN']},
                {'id': 3, 'title': 'FSSAI License', 'dept': 'Food Safety and Standards Authority', 'status': 'Pending', 'days': '7-10 days', 'documents': ['Food business details', 'ID proof', 'Applicant photo', 'Kitchen layout plan', 'Menu details']},
                {'id': 4, 'title': 'GST Registration', 'dept': 'CBIC / GSTN', 'status': 'Pending', 'days': '3-7 days', 'documents': ['PAN', 'Bank details', 'Business address proof', 'Trade license copy']},
                {'id': 5, 'title': 'Fire NOC', 'dept': 'Fire Department', 'status': 'Pending', 'days': '7-15 days', 'documents': ['Building plan', 'NOC application', 'Safety certificates', 'Aadhaar', 'Trade license']},
                {'id': 6, 'title': 'Business Launch', 'dept': 'Self', 'status': 'Pending', 'days': '1 day', 'documents': ['All registered licenses', 'Staff Aadhaar details', 'Insurance documents']},
            ]
        },
    }

    for intent_name, template in roadmap_templates.items():
        if intent_name in intents:
            intent = intents[intent_name]
            if not intent.roadmap_template:
                intent.roadmap_template = template
    db.commit()

    # ── Services ─────────────────────────────────────────────────────
    services_data = [
        # name, department, fee, sla_days, description
        ('Shop & Establishment', 'Labour Dept', 200.00, 10, 'Registration under Shop & Establishment Act for new businesses'),
        ('Trade License', 'GHMC / Municipality', 500.00, 15, 'License to conduct commercial trade within municipal limits'),
        ('FSSAI Registration', 'Health Dept / FSSAI', 100.00, 7, 'Food safety and standards registration for food businesses'),
        ('GST Registration', 'CBIC / GSTN', 0.00, 3, 'Goods and Services Tax registration for businesses'),
        ('Birth Registration', 'Municipality', 0.00, 21, 'Registration of birth with local municipal authority'),
        ('Hospital Verification', 'Hospital / Health Dept', 0.00, 3, 'Verification of birth by the hospital where delivery took place'),
        ('Certificate Collection', 'Municipality', 0.00, 1, 'Physical collection or dispatch of issued certificate'),
        ('Marriage License', 'Revenue Dept / SRM', 1000.00, 30, 'Official registration of marriage under applicable Act'),
        ('Stamp Duty Payment', 'Sub-Registrar / IGR', 5000.00, 1, 'Payment of legal stamp duty for property transactions'),
        ('Property Deed Registration', 'Sub-Registrar', 1000.00, 7, 'Formal registration of sale deed / conveyance deed'),
        ('Document Verification', 'MRO / Tahsildar Office', 50.00, 7, 'Verification of identity and address documents by revenue authority'),
        ('Udyam Registration', 'Ministry of MSME', 0.00, 1, 'Self-declaration based MSME registration (udyam.gov.in)'),
        ('Community Verification', 'MRO Office', 0.00, 15, 'Caste and community verification by local revenue authorities'),
        ('Income Verification', 'MRO Office', 50.00, 7, 'Verification of annual household income by tehsildar'),
        ('Learner License Slot', 'RTO / Transport Dept', 150.00, 3, 'Booking slot for learner license test at RTO'),
        ('Permanent DL Slot', 'RTO / Transport Dept', 300.00, 15, 'Booking slot for permanent driving license test at RTO'),
        ('Voter Form 8 Submission', 'Election Commission', 0.00, 30, 'Correction in voter details via Form 8'),
        ('Voter Form 6 Submission', 'Election Commission', 0.00, 30, 'New voter ID card application via Form 6'),
        ('PAN Application', 'Income Tax Dept / NSDL / UTIITSL', 107.00, 15, 'Application for new Permanent Account Number'),
        ('Passport Application', 'MEA / Passport Seva', 1500.00, 30, 'Application for new passport or renewal at Passport Seva Kendra'),
        ('Police Verification', 'Police Dept', 0.00, 15, 'Background verification by local police station for passport / other clearances'),
        ('Pollution NOC', 'Pollution Control Board', 5000.00, 30, 'No Objection Certificate from State Pollution Control Board'),
        ('Fire NOC', 'Fire Department', 2000.00, 15, 'Fire safety NOC from fire department for commercial / residential buildings'),
        ('Building Plan Approval', 'Municipality / GHMC', 5000.00, 30, 'Approval of building / construction plan from municipal authority'),
        ('Ration Card Application', 'Civil Supplies Dept', 0.00, 30, 'Application for new ration card or transfer of existing card'),
        ('Senior Citizen Certificate', 'Revenue Dept / MRO', 0.00, 15, 'Issuance of senior citizen certificate for age-based benefits'),
        ('Bank Account Opening', 'Banks', 0.00, 7, 'Opening a zero-balance or regular savings bank account'),
        ('Mobile Number Linking', 'Telecom Providers', 0.00, 1, 'Linking Aadhaar-linked mobile number with services'),
        ('Photograph', 'Photo Studio / CSC', 50.00, 1, 'Passport-size photographs for applications'),
        ('Notary Public', 'Legal / Notary Office', 100.00, 1, 'Notarization of documents by authorized notary public'),
        ('Affidavit', 'Legal / Notary Office', 50.00, 1, 'Sworn affidavit on stamp paper for official declarations'),
        ('Police Clearance', 'Police Dept', 0.00, 30, 'Police clearance certificate for employment / travel purposes'),
        ('Skill Certificate', 'Education Dept / Skill Dev', 0.00, 15, 'Certification of skills under Skill India / NSDC programs'),
        ('Minority Certificate', 'Revenue Dept / MRO', 0.00, 15, 'Certificate confirming minority community status'),
        ('BPL Certificate', 'MRO Office', 0.00, 10, 'Below Poverty Line certificate for welfare scheme eligibility'),
        ('EWS Certificate', 'Revenue Dept / MRO', 0.00, 15, 'Economically Weaker Section certificate for reservation benefits'),
        ('Disability Certificate', 'Medical Board / District Hospital', 0.00, 30, 'Certificate of disability from authorized medical board'),
        ('Farm Subsidy Application', 'Agriculture Dept', 0.00, 30, 'Application for government farm subsidy schemes'),
        ('Aadhaar Update', 'UIDAI / CSC', 50.00, 15, 'Update or correction of Aadhaar card details'),
        ('Aadhaar Linking', 'UIDAI / Banks / Telecom', 0.00, 3, 'Linking Aadhaar with bank account, mobile, or other services'),
    ]

    services = {}
    for name, dept, fee, sla, desc in services_data:
        existing = db.query(models.Service).filter(models.Service.name == name).first()
        if not existing:
            service = models.Service(name=name, department=dept, fee=fee, sla_days=sla, description=desc)
            db.add(service)
            db.flush()
            services[name] = service
        else:
            services[name] = existing

    db.commit()

    # ── Intent → Service Mappings (workflow DAGs) ────────────────────
    # Each tuple: (service_name, step_order)
    workflow_mappings = [
        ('Tea Shop', [
            ('Shop & Establishment', 1),
            ('Trade License', 2),
            ('FSSAI Registration', 3),
            ('GST Registration', 4),
        ]),
        ('Birth Certificate', [
            ('Hospital Verification', 1),
            ('Birth Registration', 2),
            ('Certificate Collection', 3),
        ]),
        ('Farm Subsidy', [
            ('Income Verification', 1),
            ('Farm Subsidy Application', 2),
        ]),
        ('Marriage Registration', [
            ('Document Verification', 1),
            ('Marriage License', 2),
        ]),
        ('Property Registration', [
            ('Stamp Duty Payment', 1),
            ('Document Verification', 2),
            ('Property Deed Registration', 3),
        ]),
        ('MSME Registration', [
            ('Udyam Registration', 1),
            ('GST Registration', 2),
            ('Bank Account Opening', 3),
        ]),
        ('Caste Certificate', [
            ('Community Verification', 1),
        ]),
        ('Income Certificate', [
            ('Income Verification', 1),
        ]),
        ('Driving License', [
            ('Learner License Slot', 1),
            ('Permanent DL Slot', 2),
        ]),
        ('Voter ID Update', [
            ('Voter Form 8 Submission', 1),
        ]),
        ('PAN Card', [
            ('Photograph', 1),
            ('PAN Application', 2),
        ]),
        ('Passport', [
            ('Photograph', 1),
            ('Police Verification', 2),
            ('Passport Application', 3),
        ]),
        ('Trade License', [
            ('Shop & Establishment', 1),
            ('Trade License', 2),
        ]),
        ('Pollution Certificate', [
            ('Pollution NOC', 1),
        ]),
        ('Fire NOC', [
            ('Fire NOC', 1),
        ]),
        ('Building Plan Approval', [
            ('Building Plan Approval', 1),
            ('Fire NOC', 2),
            ('Pollution NOC', 3),
            ('Trade License', 4),
        ]),
        ('Ration Card', [
            ('Income Verification', 1),
            ('Document Verification', 2),
            ('Ration Card Application', 3),
        ]),
        ('Senior Citizen Certificate', [
            ('Document Verification', 1),
            ('Senior Citizen Certificate', 2),
        ]),
        ('Student Scholarship', [
            ('Income Verification', 1),
            ('Document Verification', 2),
        ]),
        ('Food Truck Restaurant', [
            ('Shop & Establishment', 1),
            ('Trade License', 2),
            ('FSSAI Registration', 3),
            ('GST Registration', 4),
            ('Fire NOC', 5),
        ]),
    ]

    for intent_name, steps in workflow_mappings:
        intent = intents[intent_name]
        for s_name, order in steps:
            service = services[s_name]
            existing_map = db.query(models.IntentService).filter(
                models.IntentService.intent_id == intent.id,
                models.IntentService.service_id == service.id
            ).first()
            if not existing_map:
                db.add(models.IntentService(intent_id=intent.id, service_id=service.id, step_order=order))

    db.commit()

    # ── Service Dependencies ─────────────────────────────────────────
    dependency_pairs = [
        ('Trade License', 'Shop & Establishment'),
        ('Property Deed Registration', 'Stamp Duty Payment'),
        ('Property Deed Registration', 'Document Verification'),
        ('FSSAI Registration', 'Shop & Establishment'),
        ('GST Registration', 'Udyam Registration'),
        ('Permanent DL Slot', 'Learner License Slot'),
        ('Passport Application', 'Police Verification'),
        ('Ration Card Application', 'Income Verification'),
        ('Ration Card Application', 'Document Verification'),
        ('Building Plan Approval', 'Fire NOC'),
        ('Building Plan Approval', 'Pollution NOC'),
        ('Trade License', 'Fire NOC'),
        ('Trade License', 'Pollution NOC'),
    ]

    for s1_name, s2_name in dependency_pairs:
        s1 = services[s1_name]
        s2 = services[s2_name]
        existing_dep = db.query(models.ServiceDependency).filter(
            models.ServiceDependency.service_id == s1.id,
            models.ServiceDependency.requires_service_id == s2.id
        ).first()
        if not existing_dep:
            db.add(models.ServiceDependency(service_id=s1.id, requires_service_id=s2.id))

    db.commit()

    # ── Schemes ──────────────────────────────────────────────────────
    schemes_data = [
        ('PM SVANidhi', 'Working capital loan up to Rs 50,000 for street vendors', {'category': 'vendor', 'region': 'urban', 'max_income': None}),
        ('MUDRA Shishu Loan', 'Collateral-free loan up to Rs 50,000 for micro businesses', {'category': 'business', 'region': 'all', 'max_income': None}),
        ('MUDRA Kishore Loan', 'Loan from Rs 50,000 to Rs 5 lakhs for growing businesses', {'category': 'business', 'region': 'all', 'min_investment': 50000, 'max_investment': 500000}),
        ('MUDRA Tarun Loan', 'Loan from Rs 5 lakhs to Rs 10 lakhs for established businesses', {'category': 'business', 'region': 'all', 'min_investment': 500000, 'max_investment': 1000000}),
        ('PM-KISAN', 'Rs 6,000 per year direct benefit transfer to farmers in 3 instalments', {'category': 'farmer', 'region': 'all', 'landholding': True}),
        ('Rythu Bandhu', 'Rs 10,000 per acre investment support for Telangana farmers', {'category': 'farmer', 'region': 'telangana', 'landholding': True}),
        ('T-PRIDE Telangana', 'Entrepreneurship support and capital subsidy for SC/ST/OBC candidates', {'category': 'sc_st', 'region': 'telangana'}),
        ('PM Jan Dhan Yojana', 'Zero balance bank account with Rs 2 lakh accident insurance', {'category': 'general', 'region': 'all', 'bank_account': False}),
        ('PM Jeevan Jyoti Bima', 'Life insurance at Rs 436/year for age group 18-50', {'category': 'general', 'region': 'all', 'age_min': 18, 'age_max': 50}),
        ('PM Suraksha Bima', 'Accident insurance at Rs 20/year for age group 18-70', {'category': 'general', 'region': 'all', 'age_min': 18, 'age_max': 70}),
        ('Ayushman Bharat', 'Health insurance up to Rs 5 lakhs per family per year for BPL families', {'category': 'bpl', 'region': 'all', 'max_income': 270000}),
        ('Kalyana Lakshmi', 'Financial assistance up to Rs 1,00,016 for SC/ST/OBC girl marriages in Telangana', {'category': 'sc_st', 'region': 'telangana', 'marriage': True}),
        ('Shaadi Mubarak', 'Financial assistance up to Rs 1,00,016 for Muslim minority marriages in Telangana', {'category': 'minority', 'region': 'telangana', 'marriage': True}),
        ('Post Matric Scholarship', 'Full tuition and maintenance scholarship for SC/ST students in Telangana', {'category': 'student', 'region': 'telangana', 'education_level': 'post_matric'}),
        ('Ration Card - AAY', 'Subsidized food grains (35 kg) for Antyodaya Anna Yojana families', {'category': 'bpl', 'region': 'all', 'max_income': 15000}),
        ('Ration Card - PHH', 'Subsidized food grains (5-15 kg) for priority house-hold families', {'category': 'general', 'region': 'all', 'max_income': None}),
        ('Ration Card - BPL', 'Subsidized food grains for Below Poverty Line families', {'category': 'bpl', 'region': 'all', 'max_income': None}),
        ('Udyog Aadhaar', 'MSME registration for government tenders and priority sector benefits', {'category': 'business', 'region': 'all', 'enterprise_type': 'msme'}),
        ('Startup India Seed Fund', 'Up to Rs 20 lakhs grant for DPIIT-registered startups', {'category': 'business', 'region': 'urban', 'startup_registered': True}),
        ('Skill India Certification', 'NSDC certification and skill development training for workers', {'category': 'worker', 'region': 'all', 'min_age': 15}),
        ('PM Awas Yojana', 'Housing for All - subsidised home loans and direct construction assistance', {'category': 'bpl', 'region': 'all', 'max_income': 300000}),
        ('Sukanya Samriddhi Yojana', 'High-interest savings account for girl child (birth to 10 years)', {'category': 'general', 'region': 'all', 'child_gender': 'female', 'child_age_max': 10}),
        ('Atal Pension Yojana', 'Guaranteed pension of Rs 1,000-5,000 per month after age 60', {'category': 'general', 'region': 'all', 'age_min': 18, 'age_max': 40}),
    ]

    for name, desc, rules in schemes_data:
        existing = db.query(models.Scheme).filter(models.Scheme.name == name).first()
        if not existing:
            db.add(models.Scheme(name=name, description=desc, eligibility_rules=rules))

    db.commit()

    # ── Demo Users ───────────────────────────────────────────────────
    demo_users = [
        ('+919000000001', 'Rajesh Kumar', {'age': 35, 'gender': 'male', 'occupation': 'farmer'}),
        ('+919000000002', 'Lakshmi Devi', {'age': 55, 'gender': 'female', 'occupation': 'homemaker'}),
        ('+919000000003', 'Mohammed Irfan', {'age': 28, 'gender': 'male', 'occupation': 'street_vendor'}),
        ('+919000000004', 'Priya Reddy', {'age': 32, 'gender': 'female', 'occupation': 'teacher'}),
        ('+919000000005', 'Venkatesh Naidu', {'age': 45, 'gender': 'male', 'occupation': 'businessman'}),
    ]

    admin_users = [
        ('anilkumarvalaboju@gmail.com', 'Anil Kumar Admin'),
    ]

    users = {}
    for phone, name, demo in demo_users:
        existing = db.query(models.User).filter(models.User.phone == phone).first()
        if not existing:
            user = models.User(phone=phone, name=name, demographics=demo)
            db.add(user)
            db.flush()
            users[phone] = user
        else:
            users[phone] = existing

    for email, name in admin_users:
        existing = db.query(models.User).filter(models.User.email == email).first()
        if not existing:
            user = models.User(email=email, name=name, role="admin", is_verified=True)
            db.add(user)
            db.flush()
        elif existing.role != "admin":
            existing.role = "admin"
            existing.name = name

    db.commit()

    # ── User Profiles ────────────────────────────────────────────────
    profiles_data = [
        ('+919000000001', 'Rajesh Kumar', '9000000001', None, 'Telangana', 'Warangal', 'farmer', 'Telugu',
         {'age': 35, 'gender': 'male', 'occupation': 'farmer', 'annual_income': 120000, 'category': 'bc', 'land_acres': 3}),
        ('+919000000002', 'Lakshmi Devi', '9000000002', None, 'Telangana', 'Hyderabad', 'senior_citizen', 'Telugu',
         {'age': 55, 'gender': 'female', 'occupation': 'homemaker', 'annual_income': 80000, 'category': 'general'}),
        ('+919000000003', 'Mohammed Irfan', '9000000003', 'irfan.demo@email.com', 'Telangana', 'Secunderabad', 'vendor', 'Urdu',
         {'age': 28, 'gender': 'male', 'occupation': 'street_vendor', 'annual_income': 96000, 'category': 'minority'}),
        ('+919000000004', 'Priya Reddy', '9000000004', 'priya.demo@email.com', 'Telangana', 'Hyderabad', 'general', 'Telugu',
         {'age': 32, 'gender': 'female', 'occupation': 'teacher', 'annual_income': 360000, 'category': 'general'}),
        ('+919000000005', 'Venkatesh Naidu', '9000000005', None, 'Telangana', 'Hyderabad', 'business', 'Telugu',
         {'age': 45, 'gender': 'male', 'occupation': 'businessman', 'annual_income': 600000, 'category': 'general'}),
    ]

    for phone, full_name, p_phone, email, loc, dist, ctype, lang, demo in profiles_data:
        user = users[phone]
        existing = db.query(models.UserProfile).filter(models.UserProfile.user_id == user.id).first()
        if not existing:
            db.add(models.UserProfile(
                user_id=user.id, full_name=full_name, phone=p_phone, email=email,
                location=loc, district=dist, citizen_type=ctype, preferred_language=lang,
                demographics=demo
            ))

    db.commit()

    # ── Sample Documents for Demo Users ──────────────────────────────
    sample_docs = [
        # (phone, doc_type, filename, raw_text, extracted_data, confidence, status)
        ('+919000000001', 'aadhaar', 'rajesh_aadhaar.pdf',
         'UIDAI Aadhaar Card\nName: RAJESH KUMAR\nDOB: 15/06/1991\nGender: Male\nAadhaar: XXXX-XXXX-3456\nAddress: H.No 4-5-6, Warangal, Telangana 506001',
         {'name': 'RAJESH KUMAR', 'dob': '15/06/1991', 'gender': 'Male', 'aadhaar_last4': '3456', 'address': 'Warangal, Telangana'},
         '95%', 'verified'),

        ('+919000000001', 'land_record', 'rajesh_land.pdf',
         'Telangana Land Records\nSurvey No: 45/2\nExtent: 3.0 Acres\nOwner: RAJESH KUMAR\nVillage: Kazipet, Warangal District\nLand Type: Dry Land / Agricultural',
         {'survey_no': '45/2', 'extent_acres': 3.0, 'owner': 'RAJESH KUMAR', 'village': 'Kazipet', 'district': 'Warangal', 'land_type': 'agricultural'},
         '90%', 'verified'),

        ('+919000000002', 'aadhaar', 'lakshmi_aadhaar.pdf',
         'UIDAI Aadhaar Card\nName: LAKSHMI DEVI\nDOB: 22/03/1971\nGender: Female\nAadhaar: XXXX-XXXX-7890\nAddress: Flat 201, SR Nagar, Hyderabad 500038',
         {'name': 'LAKSHMI DEVI', 'dob': '22/03/1971', 'gender': 'Female', 'aadhaar_last4': '7890', 'address': 'SR Nagar, Hyderabad'},
         '97%', 'verified'),

        ('+919000000003', 'aadhaar', 'irfan_aadhaar.pdf',
         'UIDAI Aadhaar Card\nName: MOHAMMAD IRFAN\nDOB: 10/11/1998\nGender: Male\nAadhaar: XXXX-XXXX-1234\nAddress: Balanagar, Secunderabad, Telangana 500018',
         {'name': 'MOHAMMAD IRFAN', 'dob': '10/11/1998', 'gender': 'Male', 'aadhaar_last4': '1234', 'address': 'Balanagar, Secunderabad'},
         '93%', 'verified'),

        ('+919000000003', 'voter_id', 'irfan_voter.pdf',
         'Election Commission of India\nEPIC No: XYZ1234567\nName: MOHAMMAD IRFAN\nFather/Husband: ABDUL RAHAMAN\nAge: 28\nAddress: Balanagar, Secunderabad\nConstituency: Secunderabad Cantonment',
         {'epic_no': 'XYZ1234567', 'name': 'MOHAMMAD IRFAN', 'father': 'ABDUL RAHAMAN', 'constituency': 'Secunderabad Cantonment'},
         '88%', 'verified'),

        ('+919000000004', 'aadhaar', 'priya_aadhaar.pdf',
         'UIDAI Aadhaar Card\nName: PRIYA REDDY\nDOB: 05/08/1994\nGender: Female\nAadhaar: XXXX-XXXX-5678\nAddress: Madhapur, Hyderabad, Telangana 500084',
         {'name': 'PRIYA REDDY', 'dob': '05/08/1994', 'gender': 'Female', 'aadhaar_last4': '5678', 'address': 'Madhapur, Hyderabad'},
         '96%', 'verified'),

        ('+919000000004', 'degree_certificate', 'priya_degree.pdf',
         'Osmania University\nBachelor of Education (B.Ed)\nName: PRIYA REDDY\nYear of Passing: 2016\nPercentage: 78%\nRoll No: 1401-010-045',
         {'university': 'Osmania University', 'degree': 'B.Ed', 'year': 2016, 'percentage': 78.0, 'roll_no': '1401-010-045'},
         '92%', 'verified'),

        ('+919000000005', 'aadhaar', 'venkatesh_aadhaar.pdf',
         'UIDAI Aadhaar Card\nName: VENKATESH NAIDU\nDOB: 12/01/1981\nGender: Male\nAadhaar: XXXX-XXXX-9012\nAddress: Ameerpet, Hyderabad, Telangana 500016',
         {'name': 'VENKATESH NAIDU', 'dob': '12/01/1981', 'gender': 'Male', 'aadhaar_last4': '9012', 'address': 'Ameerpet, Hyderabad'},
         '94%', 'verified'),

        ('+919000000005', 'business_registration', 'venkatesh_msme.pdf',
         'Udyam Registration Certificate\nUdyam No: UDYAM-TS-05-0001234\nEnterprise: Naidu Traders\nType: Micro Enterprise\nOwner: VENKATESH NAIDU\nActivity: Wholesale Trading\nInvestment in Plant: Rs 8,00,000',
         {'udyam_no': 'UDYAM-TS-05-0001234', 'enterprise': 'Naidu Traders', 'type': 'Micro Enterprise', 'investment': 800000},
         '91%', 'verified'),
    ]

    for phone, doc_type, filename, raw_text, extracted, conf, status in sample_docs:
        user = users[phone]
        existing = db.query(models.UserDocument).filter(
            models.UserDocument.user_id == user.id,
            models.UserDocument.doc_type == doc_type
        ).first()
        if not existing:
            db.add(models.UserDocument(
                user_id=user.id, doc_type=doc_type, filename=filename,
                raw_text=raw_text, extracted_data=extracted,
                confidence=conf, status=status
            ))

    db.commit()
    db.close()

if __name__ == "__main__":
    init_db()

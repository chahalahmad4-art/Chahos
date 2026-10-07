// Bounded dialect normalization for the offline demo; not a general translator.
const groups={
 price:['adde','addeh','2adde','2addeh','ade','adeh','adeish','addesh','se3er','قديش','قديه','اديه','بقديش','سعر'],
 membership:['eshterak','eshtirak','eshtrak','ishtirak','leshtirak','leshterak','اشتراك','الاشتراك','اشتراكي'],
 gym:['lgym','jim','جيم','الجيم'],
 boxing:['boxe','lboxing','بوكسينغ','بوكسينج','بوكس','البوكسينغ','ملاكمة'],
 schedule:['emta','imta','aymta','aimta','ايمتى','امتى','مواعيد','المواعيد'],
 booking:['ehjez','e7jez','e7joz','7ejz','7ajz','احجز','حجز','الحجز'],
 trial:['jarreb','jarrib','jareb','جرب','جرّب','تجربة','تجريبية'],
 location:['wen','wein','wayn','maw2a3','maw2a3kon','وين','موقع','الموقع','موقعكن'],
 cancellation:['elghi','elghe','cancel','الغي','الغاء'],
 refund:['رجعولي','استرجاع','masare','masari','مصاري'],
};
const aliases=new Map(Object.entries(groups).flatMap(([key,values])=>values.map(v=>[v,key])));
export const canonicalToken=t=>aliases.get(t)||t;
export function replyLanguage(text,requested='auto'){
 if(['en','ar-LB','arabizi'].includes(requested))return requested;
 if(/[\u0600-\u06ff]/.test(String(text)))return 'ar-LB';
 const words=String(text).toLowerCase().match(/[a-z0-9]+/g)||[];
 return words.some(w=>(aliases.has(w)&&!['cancel','boxe'].includes(w))||['bade','baddi','badi','shu','shou','fik','fini','ma3','sadiei','ma3kon'].includes(w))?'arabizi':'en';
}
const notices={
 empty:['اكتب سؤالك بالأول.','Ektob sou2alak bel awal.'],
 too_long:['خلّي سؤالك أقل من 1500 حرف.','Khalli sou2alak a2al men 1500 7aref.'],
 injection:['فيني ساعدك بمعلومات الشغل، بس ما فيني غيّر القواعد أو اكشف معلومات سرّية.','Fini se3dak b ma3loumet l sheghel, bas ma fini ghayyer l rules aw ekshaf asrar.'],
 privacy:['معلومات الزباين خاصة، وما فيني اعطيك بيانات أشخاص تانيين.','Ma3loumet l zbayen khassa. Ma fini a3tik bayenet ashkhas tenyine.'],
 handoff:['هالسؤال بدّه مختص. فيني ساعدك بمعلومات خدمات الشركة بس.','Hal sou2al baddo mokhtass. Fini se3dak b ma3loumet khadmet l gym bas.'],
 abstained:['ما عندي معلومة بالمصادر بتجاوب عهالسؤال. خلّينا نتأكد من حدا من الفريق.','Ma 3ande ma3loume bel masader btjewib 3a hal sou2al. Khallina net2akkad men l team.'],
 output_rejected:['الجواب ما مرق بفحص المصادر. فيك تشوف المقاطع أو تتأكد من الفريق.','L jaweb ma mara2 b fa7es l masader. Fik tshouf l sources aw tes2al l team.'],
};
export function localNotice(reason,lang,fallback){return lang==='en'?fallback:(notices[reason]?.[lang==='arabizi'?1:0]||fallback);}
export const seedReplies={
 membership:{'ar-LB':'بمثال Cedar Gym التجريبي، اشتراك الجيم 35 دولار بالشهر، وبيشمل الحديد والكارديو. التدريب الخاص إلو تسعيرة لحاله.',arabizi:'B demo Cedar Gym, eshterak l gym $35 bel shaher, w byeshmal 7adid w cardio. L personal training elo se3er la7alo.'},
 boxing:{'ar-LB':'اشتراك البوكسينغ بالمثال 35 دولار بالشهر، غير اشتراك الجيم. الحصص التلاتا والخميس الساعة 5 بعد الضهر، والسبت الساعة 10 الصبح، بتوقيت بيروت.',arabizi:'L boxing bel demo $35 bel shaher, gheir eshterak l gym. L 7osas tleta w khamis se3a 5 ba3d l dohor, w sebet se3a 10 l sobo7, b taw2it Beirut.'},
 trial:{'ar-LB':'فيك تطلب زيارة تعارف مجانية مدّتها نص ساعة. الحجز بدّه تأكيد منك. المواعيد هون تجريبية، مش مربوطة بروزنامة حقيقية.',arabizi:'Fik totlob ziyara ta3arof majjeniyye nos se3a. L 7ajez baddo te2kid mennak. L mawe3id hon demo, mesh calendar 7a2i2e.'},
 cancellation:{'ar-LB':'إلغاء الزيارة التجريبية لازم يكون قبل الموعد بـ12 ساعة عالقليلة. بخصوص استرجاع مصاري الاشتراك، الإدارة لازم تراجع الطلب؛ ما فيني وافق عالاسترجاع.',arabizi:'Elgha l ziyara lezem ykoun abel l maw3ad b 12 se3a 3al alile. Radd masare l eshterak baddo moraja3a men l idara; ma fini wefe2 3aleh.'},
 contact:{'ar-LB':'Cedar Gym هون مثال تجريبي لجيم بطرابلس، لبنان. ما في عنوان تفصيلي أو رقم حقيقي بهالمثال. للطلبات الخاصة، لازم تتواصل مع الفريق.',arabizi:'Cedar Gym hon demo la gym b Trablos, Lebnen. Ma fi 3enwen tafsile aw ra2em 7a2i2e bel demo. Lal talab l khas, lezem tes2al l team.'}
};
export function trialIntent(text){return /\b(?:book|booking|trial|ehjez|e7jez|e7joz|7ejz|7ajz|jarreb|jarrib)\b|حجز|احجز|إحجز|موعد|جرب/i.test(text);}
export function trialService(text){return /boxing|boxe|بوكس|ملاكمة/i.test(text)?'Boxing':/personal|private|خاص/i.test(text)?'Personal training':'Gym membership';}
export function localAgent(result,lang){
 if(lang==='en')return result;
 if(result.tool==='prepare_trial')return {...result,message:lang==='arabizi'?'Tamem! 3abbe ma3loumetak ta7et, reje3 l khotta w ba3den akkéd. Ba3d ma n7ajaz shi.':'تمام! عبّي معلوماتك تحت، راجع الخطوات وبعدين أكّد. بعد ما انحجز شي.'};
 if(result.tool==='human_handoff')return {...result,message:lang==='arabizi'?'Hal talab baddo moraja3a men l team. Ma naffazna ayya ejre2.':'هالطلب بدّه مراجعة من الفريق. ما نفّذنا أي إجراء.'};
 return result;
}

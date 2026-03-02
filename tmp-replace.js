const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'ADMINSER', 'Desktop', 'facebook', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const newFeatures = `      <section id="features" className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto space-y-32">

          {/* Feature 1: Dashboard / Ads Overview */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <span className="text-purple-600 font-bold tracking-wider text-sm uppercase block">PERFORMANCE</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {isThai ? "ภาพรวมโฆษณา ครบจบในที่เดียว" : "Centralized Ads Dashboard"}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                {isThai
                  ? "บริหารบัญชีโฆษณาต่างๆ ของคุณได้ในที่เดียว ดูประวัติการ Export ตรวจเช็กข้อผิดพลาด และสรุปยอดที่ใช้งบไปแล้วได้อย่างโปร่งใส"
                  : "Manage all your ad accounts from one powerful dashboard. Review export history, check for errors, and summarize ad spend transparently."}
              </p>
              
              <div className="space-y-4 pt-4">
                <div className="flex gap-4 items-start">
                  <div className="rounded-full p-2 bg-purple-50 text-purple-600 shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{isThai ? "จัดการง่าย" : "Easy Management"}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isThai ? "มองเห็นบัญชีและสถานะการ Exports ภาพรวม" : "See accounts and overall export statuses at a glance."}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="absolute -inset-4 bg-gradient-to-tr from-purple-100 to-pink-50 dark:from-purple-900/20 dark:to-pink-500/10 rounded-[2.5rem] blur-2xl opacity-50" />
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 overflow-hidden h-full">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4">
                    <div className="text-xs font-medium text-slate-500 mb-1">Total Spend Sync</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">$14,230</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4">
                    <div className="text-xs font-medium text-slate-500 mb-1">Rows Exported</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">12,492</div>
                  </div>
                </div>
                <div className="flex items-end gap-2 h-32 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {[40, 70, 45, 90, 65, 80, 55].map((height, i) => (
                    <div key={i} className="flex-1 rounded-t-sm bg-purple-100 dark:bg-purple-900/40 relative group">
                      <div
                        className="absolute bottom-0 w-full rounded-t-sm bg-purple-500 dark:bg-purple-400 transition-all cursor-pointer group-hover:bg-purple-600"
                        style={{ height: \`\${height}%\` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 text-[10px] font-medium text-slate-400">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Automation */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none order-2 lg:order-1">
              <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-100 to-emerald-50 dark:from-cyan-900/20 dark:to-emerald-500/10 rounded-[2.5rem] blur-2xl opacity-50" />
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 overflow-hidden h-full min-h-[300px] flex flex-col justify-center">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-500">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Daily Sync</div>
                        <div className="text-xs text-slate-500">Every morning at 08:00 AM</div>
                      </div>
                    </div>
                    <div className="w-10 h-5 rounded-full bg-cyan-500 relative transition-colors duration-200">
                      <div className="absolute right-1 top-1 w-3 h-3 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Run ID: #4829</span>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] px-2 py-0 border-none">Success</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Run ID: #4828</span>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] px-2 py-0 border-none">Success</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 opacity-60">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Run ID: #4827</span>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] px-2 py-0 border-none">Success</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 order-1 lg:order-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold tracking-wider text-sm uppercase block">AUTOMATION</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {isThai ? "จัดการให้ทุกวัน ไม่ต้องตื่นมาทำเอง แบบมัลติ" : "Set it and forget it"}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                {isThai
                  ? "ตั้งเวลาการดึงข้อมูลรายวันไว้ล่วงหน้า ระบบจะทำงานให้คุณตอนเช้าตรู่ พอคุณเปิดคอมทำงาน ข้อมูลพร้อมวิเคราะห์ใน Sheet เรียบร้อยแล้ว รองรับหลายบัญชีโฆษณาพร้อมกัน"
                  : "Schedule daily syncs across multiple ad accounts in advance. By the time you start your workday, all your ad data is already waiting for you."}
              </p>
              
              <div className="space-y-4 pt-4">
                <div className="flex gap-4 items-start">
                  <div className="rounded-full p-2 bg-cyan-50 text-cyan-600 shrink-0">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{isThai ? "อัปเดตอัตโนมัติ" : "Automatic Updates"}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isThai ? "ตั้งค่าได้ว่าให้ระบบทำงานดึงล่าสุดไปอัปเดตเองทุกวัน" : "Configure the system to automatically update your sheets daily."}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Auto Campaign Creation */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <span className="text-indigo-600 font-bold tracking-wider text-sm uppercase block">AI CREATION</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {isThai ? "สร้างแคมเปญโฆษณาบน Facebook ด้วยระบบอัตโนมัติ" : "Automated Campaign Creation"}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                {isThai
                  ? "ประหยัดเวลาสร้างแคมเปญเองทีละขั้นตอน ระบบจัดการให้ตั้งแต่วางโครงสร้างแคมเปญ ชุดโฆษณา และโฆษณา ครบจบในไม่กี่คลิก"
                  : "Save hours of manual campaign setup. Our wizard handles campaign structure, ad sets, and ads in just a few clicks."}
              </p>
              
              <div className="space-y-4 pt-4">
                <div className="flex gap-4 items-start">
                  <div className="rounded-full p-2 bg-indigo-50 text-indigo-600 shrink-0">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{isThai ? "จัดการง่ายในไม่กี่คลิก" : "Easy Wizard"}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isThai ? "ช่วยผู้ใช้ตั้งค่าและสร้างโฆษณาแบบมืออาชีพได้อย่างรวดเร็ว" : "Set up professional ads easily and quickly."}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-100 to-violet-50 dark:from-indigo-900/20 dark:to-violet-500/10 rounded-[2.5rem] blur-2xl opacity-50" />
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 overflow-hidden h-full">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Auto Creation Wizard</div>
                  <div className="flex gap-1">
                    <div className="w-6 h-1 rounded-full bg-indigo-500"></div>
                    <div className="w-2 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <div className="w-2 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded"></div>
                    <div className="h-10 w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center px-3">
                      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-600 rounded"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                      <div className="h-10 w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl"></div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
                      <div className="h-10 w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl"></div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end relative">
                  <div className="group flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-indigo-700 cursor-pointer w-full transition-colors relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                    {isThai ? "สร้างแคมเปญโฆษณา" : "Launch Campaign"}
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Engagement Audience */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none order-2 lg:order-1">
              <div className="absolute -inset-4 bg-gradient-to-tr from-rose-100 to-orange-50 dark:from-rose-900/20 dark:to-orange-500/10 rounded-[2.5rem] blur-2xl opacity-50" />
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 overflow-hidden h-full">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-rose-500" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">Audience Builder</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 mb-4">
                  <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Select Fan Pages</div>
                  <div className="space-y-2">
                    {[
                      { name: "Centxo Global", active: true },
                      { name: "Centxo TH", active: true },
                      { name: "Centxo Backup", active: false }
                    ].map((page, i) => (
                      <div key={i} className={\`flex items-center gap-3 p-2 rounded-lg border \${page.active ? 'bg-white border-rose-200 dark:bg-slate-800 dark:border-rose-900/50' : 'bg-transparent border-transparent opacity-50'}\`}>
                        <div className={\`w-4 h-4 rounded-sm flex items-center justify-center \${page.active ? 'bg-rose-500 text-white' : 'border border-slate-300 dark:border-slate-600'}\`}>
                          {page.active && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{page.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30">
                  <div>
                    <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">Estimated Audience Size</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">1.2M - 1.5M</div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 order-1 lg:order-2">
              <span className="text-rose-600 dark:text-rose-400 font-bold tracking-wider text-sm uppercase block">TARGETING</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {isThai ? "สร้าง Engagement Audience แบบหลายเพจหลายบัญชี" : "Cross-Page Engagement Audience"}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                {isThai
                  ? "ดึงคนมีส่วนร่วมจากหลายแฟนเพจมารวมกันแบบข้ามบัญชีโฆษณาได้อย่างง่ายดาย ขยายฐานลูกค้า Retargeting ให้กว้างและแม่นยำขึ้น"
                  : "Combine engaged users from multiple fan pages across different ad accounts instantly. Expand your retargeting pool to increase conversion precision."}
              </p>
              
              <div className="space-y-4 pt-4">
                <div className="flex gap-4 items-start">
                  <div className="rounded-full p-2 bg-rose-50 text-rose-600 shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{isThai ? "ขยายฐานลูกค้า" : "Expand Reach"}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isThai ? "ไม่ต้องแยกสร้าง Custom Audience ทีละเพจอีกต่อไป" : "Stop creating Custom Audiences for one page at a time."}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 5: Export to Sheets */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <span className="text-emerald-600 font-bold tracking-wider text-sm uppercase block">INTEGRATION</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {isThai ? "ส่งข้อมูลเข้า Sheets แบบเรียลไทม์" : "Real-time sync to Google Sheets"}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                {isThai
                  ? "เบื่อกับการต้องคอยดาวน์โหลดและรวมไฟล์ CSV หรือเปล่า? ระบบของเราดึงข้อมูล Campaign, Adsets และ Ads ทั้งหมดส่งตรงเข้า Google Sheets ทันที"
                  : "Tired of downloading and merging CSV files? Our system pulls all your Campaigns, Adsets, and Ads directly into Google Sheets instantly."}
              </p>
              
              <div className="space-y-4 pt-4">
                <div className="flex gap-4 items-start">
                  <div className="rounded-full p-2 bg-emerald-50 text-emerald-600 shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{isThai ? "แมพคอลัมน์อิสระ" : "Flexible Column Mapping"}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isThai ? "กำหนดเองได้ว่าข้อมูลไหนจะไปอยู่คอลัมน์ไหน" : "Define exactly which metrics go to which columns."}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-100 to-teal-50 dark:from-emerald-900/20 dark:to-teal-500/10 rounded-[2.5rem] blur-2xl opacity-50" />
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-4 sm:p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="mx-auto flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">docs.google.com/spreadsheets</span>
                  </div>
                </div>
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 flex flex-col">
                   <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                     <div className="w-1/3">Campaign</div>
                     <div className="w-1/4">Spend</div>
                     <div className="w-1/6">CTR</div>
                     <div className="w-1/4">Purchase</div>
                   </div>
                   {[
                     { camp: "Q3_Sale_Retargeting", spend: "$450.00", ctr: "2.4%", pur: "12" },
                     { camp: "LeadGen_Broad_v2", spend: "$1,200.50", ctr: "1.8%", pur: "45" },
                     { camp: "Brand_Awareness_Top", spend: "$80.00", ctr: "0.9%", pur: "2" },
                     { camp: "Lookalike_1%_Purchasers", spend: "$650.25", ctr: "3.1%", pur: "28" },
                   ].map((row, i) => (
                     <div key={i} className="flex border-b border-slate-100 dark:border-slate-700/50 px-3 py-3 text-[11px] text-slate-600 dark:text-slate-300">
                       <div className="w-1/3 font-medium text-slate-800 dark:text-slate-200 truncate pr-2">{row.camp}</div>
                       <div className="w-1/4">{row.spend}</div>
                       <div className="w-1/6 text-emerald-500">{row.ctr}</div>
                       <div className="w-1/4">{row.pur}</div>
                     </div>
                   ))}
                </div>
                <div className="absolute bottom-8 right-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-700">
                  <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Sync Complete</h5>
                    <p className="text-[10px] text-slate-500">24 campaigns updated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
`;

const startTag = '<section id="features"';
const endTag = '</section>';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag, startIndex) + endTag.length;

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + newFeatures + content.substring(endIndex);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully replaced features section');
} else {
    console.error('Could not find start or end tags');
}

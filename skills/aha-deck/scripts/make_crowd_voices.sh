#!/bin/bash
# Renders 18 voices saying everyday campus chatter (macOS `say`). Then run mix_crowd.py to blend them
# into a seamless 24 s crowd loop:  cd <tmp> && bash make_crowd_voices.sh && python3 -I mix_crowd.py . crowd.wav
# && afconvert -f m4af -d aac -b 64000 crowd.wav <deck>/assets/crowd.m4a   (edit TXT for other settings)
TXT=("hey, did you finish the assignment" "let's grab chai after this, yeah" "where are you sitting today" "no way, that's so funny" "I literally just got here" "are you coming to the fest on friday" "wait, which class is this" "okay okay, tell me everything" "I haven't slept at all honestly" "we should totally do that" "did you see the email from the club" "that lecture was so long" "I'll text you later" "who else is coming" "yeah, same, same" "what's the plan for tonight" "she said it was fine" "hold on, let me check" "that's actually a good idea" "I'm so hungry right now")
VOICES=("Aman" "Rishi" "Tara" "Daniel" "Karen" "Moira" "Tessa" "Samantha (English (US))" "Eddy (English (UK))" "Flo (English (US))" "Reed (English (US))" "Rocko (English (UK))" "Sandy (English (US))" "Shelley (English (UK))" "Eddy (English (US))" "Flo (English (UK))" "Reed (English (UK))" "Shelley (English (US))")
i=0
for v in "${VOICES[@]}"; do
  t=""
  for k in 1 2 3 4 5 6 7; do t="$t ${TXT[$(( (i*7 + k*3) % ${#TXT[@]} ))]}. [[slnc $((200 + RANDOM % 900))]]"; done
  say -v "$v" -r $((165 + RANDOM % 50)) --file-format=WAVE --data-format=LEI16@22050 -o "v$i.wav" "$t" && echo "$i ok $v" || echo "$i FAIL $v"
  i=$((i+1))
done

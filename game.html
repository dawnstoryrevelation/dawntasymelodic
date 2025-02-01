import time
import sys
from colorama import Fore, Style, init

init(autoreset=True)

# Game State Tracking
player_name = "Yay"
inventory = []
allies = []
trust_levels = {"Solus": 0, "Adage": 0, "Thappnon": 0}
rift_knowledge = False
city_burned = False

def typewriter(text):
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(0.03)
    print()

def chapter1():
    typewriter(f"\n{Fore.CYAN}CHAPTER 1: Unknown Town{Style.RESET_ALL}")
    typewriter(f"\nYou stand in the ruins of Unknown Town, your paws trembling. A LTR guard appears!")
    choice = input(f"\n{Fore.YELLOW}1) Fight\n2) Try to reason\n3) Run{Style.RESET_ALL}\n> ")
    
    if choice == "1":
        if "pike" in inventory:
            typewriter(f"\n{Fore.GREEN}You defeat the guard with your pike!{Style.RESET_ALL}")
            return chapter2()
        else:
            typewriter(f"\n{Fore.RED}You're disarmed! The guard captures you.{Style.RESET_ALL}")
            return game_over("capture")
    elif choice == "2":
        typewriter(f"\n{Fore.YELLOW}The guard laughs: 'Rebels don't negotiate!'{Style.RESET_ALL}")
        return chapter1()
    elif choice == "3":
        typewriter(f"\n{Fore.BLUE}You escape but twist your ankle! -1 future option{Style.RESET_ALL}")
        return chapter2(limping=True)
    else:
        typewriter(f"\nInvalid choice! The guard strikes...")
        return game_over("indecision")

def chapter2(limping=False):
    typewriter(f"\n{Fore.CYAN}CHAPTER 2: The Final Stand{Style.RESET_ALL}")
    typewriter("\nMyther appears wounded! LTR guards surround you both.")
    
    if limping:
        typewriter(f"\n{Fore.RED}Your injury limits movement!{Style.RESET_ALL}")
        options = ["1) Protect Myther", "2) Retreat"]
    else:
        options = ["1) Fight together", "2) Create distraction", "3) Use environment"]
    
    choice = input(f"\n{Fore.YELLOW}{' '.join(options)}{Style.RESET_ALL}\n> ")
    
    if choice == "1" and not limping:
        typewriter(f"\n{Fore.GREEN}You defeat the guards but Myther collapses!{Style.RESET_ALL}")
        allies.append("Myther's Guidance")
        return chapter3()
    elif choice == "2" or (choice == "1" and limping):
        typewriter(f"\n{Fore.RED}Retreat leaves Myther vulnerable!{Style.RESET_ALL}")
        return game_over("abandonment")
    elif choice == "3":
        typewriter(f"\n{Fore.GREEN}You collapse a wall on the guards!{Style.RESET_ALL}")
        inventory.append("demwhisperer_leaf")
        return chapter3()
    else:
        return game_over("ambush")

def chapter3():
    typewriter(f"\n{Fore.CYAN}CHAPTER 3: The Lone Hermit{Style.RESET_ALL}")
    typewriter("\nSolus refuses to help. How do you persuade him?")
    
    persuasion = [
        "1) Appeal to justice",
        "2) Mention Myther",
        "3) Show Demwhisperer leaf" if "demwhisperer_leaf" in inventory else ""
    ]
    
    choice = input(f"\n{Fore.YELLOW}{' '.join([x for x in persuasion if x])}{Style.RESET_ALL}\n> ")
    
    if choice == "1":
        trust_levels["Solus"] += 1
        typewriter(f"\n{Fore.BLUE}Solus nods grimly{Style.RESET_ALL}")
    elif choice == "2":
        trust_levels["Solus"] += 2
        typewriter(f"\n{Fore.GREEN}Solus' eyes soften{Style.RESET_ALL}")
    elif choice == "3" and "demwhisperer_leaf" in inventory:
        trust_levels["Solus"] += 3
        typewriter(f"\n{Fore.GREEN}The leaf glows! Solus agrees{Style.RESET_ALL}")
    else:
        typewriter(f"\n{Fore.RED}Solus remains unconvinced{Style.RESET_ALL}")
        return game_over("alone")
    
    allies.append("Solus")
    return chapter4()

def chapter4():
    typewriter(f"\n{Fore.CYAN}CHAPTER 4: Mission Chimera{Style.RESET_ALL}")
    typewriter("\nSara reveals herself as Chimera! Thappnon's men are surrounded.")
    
    if "Solus" in allies and trust_levels["Solus"] >= 3:
        typewriter(f"\n{Fore.GREEN}Solus creates magical barrier!{Style.RESET_ALL}")
        options = ["1) Fight Sara", "2) Protect Thappnon", "3) Disarm trap"]
    else:
        typewriter(f"\n{Fore.RED}Guards outnumber you 3:1!{Style.RESET_ALL}")
        options = ["1) Last stand", "2) Sacrifice play"]
    
    choice = input(f"\n{Fore.YELLOW}{' '.join(options)}{Style.RESET_ALL}\n> ")
    
    if "3" in choice:
        typewriter(f"\n{Fore.GREEN}You expose Chimera's plot!{Style.RESET_ALL}")
        allies.append("Thappnon")
        return chapter5()
    elif "Solus" in allies and choice == "2":
        typewriter(f"\n{Fore.BLUE}Thappnon survives but Solus falls!{Style.RESET_ALL}")
        allies.remove("Solus")
        return chapter5()
    else:
        return game_over("chimera")

def chapter5():
    typewriter(f"\n{Fore.CYAN}CHAPTER 5: The Rift Revealed{Style.RESET_ALL}")
    typewriter("\nTime Smith stands before the glowing rift. What's your move?")
    
    endings = []
    if rift_knowledge:
        endings.append("4) Reveal truth")
    if city_burned:
        endings.append("5) Atone through sacrifice")
    
    options = [
        "1) Attack directly",
        "2) Reason with him",
        "3) Destroy machine"
    ] + endings
    
    choice = input(f"\n{Fore.YELLOW}{' '.join(options)}{Style.RESET_ALL}\n> ")
    
    if choice == "4" and rift_knowledge:
        true_ending()
    elif choice == "5" and city_burned:
        redemption_ending()
    elif choice == "3":
        typewriter(f"\n{Fore.GREEN}The rift destabilizes!{Style.RESET_ALL}")
        return neutral_ending()
    else:
        return game_over("rift")

def true_ending():
    typewriter(f"\n{Fore.GREEN}You and Time Smith unite against The Rift!{Style.RESET_ALL}")
    typewriter(f"{Fore.CYAN}TRUE ENDING: Dawntasy's Promise{Style.RESET_ALL}")
    sys.exit()

def redemption_ending():
    typewriter(f"\n{Fore.BLUE}You sacrifice yourself to seal The Rift{Style.RESET_ALL}")
    typewriter(f"{Fore.CYAN}ENDING: Burnt Offering{Style.RESET_ALL}")
    sys.exit()

def neutral_ending():
    typewriter(f"\n{Fore.YELLOW}The rift closes but Time Smith escapes{Style.RESET_ALL}")
    typewriter(f"{Fore.CYAN}ENDING: Stalemate{Style.RESET_ALL}")
    sys.exit()

def game_over(reason):
    deaths = {
        "capture": "You rot in LTR cells",
        "ambush": "Arrows find their mark",
        "rift": "Reality unravels around you"
    }
    typewriter(f"\n{Fore.RED}GAME OVER: {deaths.get(reason, 'All fades to darkness')}{Style.RESET_ALL}")
    sys.exit()

if __name__ == "__main__":
    typewriter(f"{Fore.MAGENTA}\n🌟 DAWNTASY: Yay's Promise 🌟{Style.RESET_ALL}")
    chapter1()
